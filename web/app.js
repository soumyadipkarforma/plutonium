/**
 * app.js – Plutonium MCP Platform frontend logic.
 *
 * Reads configuration from config.json, collects user input, and fires a
 * repository_dispatch event via the GitHub REST API to trigger the AI agent
 * workflow.
 *
 * SECURITY NOTE: The GitHub PAT is kept only in memory (never stored in
 * localStorage or cookies) and is transmitted directly to api.github.com
 * over HTTPS.  It is NEVER sent to any other server.
 */

"use strict";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** @type {{ defaultRepo: string, eventType: string, apiBase: string }} */
let CONFIG = {
  defaultRepo: "soumyadipkarforma/plutonium",
  eventType: "run_mcp_agent",
  apiBase: "https://api.github.com",
};

async function loadConfig() {
  try {
    const resp = await fetch("config.json");
    if (resp.ok) {
      const data = await resp.json();
      CONFIG = { ...CONFIG, ...data };
    }
  } catch {
    // Non-fatal – use defaults
  }
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

const $ = (id) => document.getElementById(id);

function log(message, level = "info") {
  const box = $("status-log");

  // Remove placeholder on first real entry
  const placeholder = box.querySelector(".log-placeholder");
  if (placeholder) placeholder.remove();

  const entry = document.createElement("div");
  entry.className = `log-entry ${level}`;

  const ts = document.createElement("span");
  ts.className = "ts";
  ts.textContent = new Date().toLocaleTimeString();

  const msg = document.createElement("span");
  msg.className = "msg";
  msg.textContent = message;

  entry.appendChild(ts);
  entry.appendChild(msg);
  box.appendChild(entry);
  box.scrollTop = box.scrollHeight;
}

function setLoading(isLoading) {
  const btn = $("submit-btn");
  btn.disabled = isLoading;
  btn.textContent = isLoading ? "⏳ Running…" : "▶ Run Agent";
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validate() {
  const errors = [];

  if (!$("pat-input").value.trim()) {
    errors.push("GitHub PAT is required.");
  }
  if (!$("owner-input").value.trim()) {
    errors.push("Platform repository is required.");
  }
  if (!$("prompt-input").value.trim()) {
    errors.push("Prompt is required.");
  }
  if (!$("target-repo-input").value.trim()) {
    errors.push("Target repository is required.");
  }

  const repoPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
  const targetRepo = $("target-repo-input").value.trim();
  if (targetRepo && !repoPattern.test(targetRepo)) {
    errors.push("Target repository must be in 'owner/repo' format.");
  }
  const platformRepo = $("owner-input").value.trim();
  if (platformRepo && !repoPattern.test(platformRepo)) {
    errors.push("Platform repository must be in 'owner/repo' format.");
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// GitHub API dispatch
// ---------------------------------------------------------------------------

/**
 * Fire a repository_dispatch event on the platform repository.
 *
 * @param {string} pat           - GitHub Personal Access Token
 * @param {string} platformRepo  - "owner/repo" for THIS repository
 * @param {string} prompt        - User prompt
 * @param {string} targetRepo    - "owner/repo" for the target repository
 * @param {string} branch        - Branch in targetRepo
 */
async function dispatchWorkflow(pat, platformRepo, prompt, targetRepo, branch) {
  const url = `${CONFIG.apiBase}/repos/${platformRepo}/dispatches`;

  const body = {
    event_type: CONFIG.eventType,
    client_payload: {
      prompt,
      target_repo: targetRepo,
      branch: branch || "main",
    },
  };

  log(`Dispatching event '${CONFIG.eventType}' to ${platformRepo}…`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${pat}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(body),
  });

  if (response.status === 204) {
    // Success – GitHub returns 204 No Content for accepted dispatches
    return { ok: true };
  }

  let errorDetail = `HTTP ${response.status}`;
  try {
    const json = await response.json();
    errorDetail = json.message || errorDetail;
  } catch {
    // Ignore JSON parse errors
  }

  return { ok: false, error: errorDetail };
}

// ---------------------------------------------------------------------------
// Submit handler
// ---------------------------------------------------------------------------

async function handleSubmit() {
  const { valid, errors } = validate();
  if (!valid) {
    errors.forEach((e) => log(e, "err"));
    return;
  }

  const pat        = $("pat-input").value.trim();
  const platform   = $("owner-input").value.trim();
  const prompt     = $("prompt-input").value.trim();
  const targetRepo = $("target-repo-input").value.trim();
  const branch     = $("branch-input").value.trim() || "main";

  setLoading(true);

  try {
    const result = await dispatchWorkflow(pat, platform, prompt, targetRepo, branch);

    if (result.ok) {
      log("✅ Workflow triggered successfully!", "ok");
      log(`Target: ${targetRepo} · Branch: ${branch}`, "info");
      log(
        "🔗 Monitor progress at: " +
          `https://github.com/${platform}/actions`,
        "info"
      );
    } else {
      log(`❌ GitHub API error: ${result.error}`, "err");
      log("Check that your PAT has the 'repo' and 'workflow' scopes.", "warn");
    }
  } catch (err) {
    log(`❌ Network error: ${err.message}`, "err");
  } finally {
    setLoading(false);
  }
}

// ---------------------------------------------------------------------------
// Reset handler
// ---------------------------------------------------------------------------

function handleReset() {
  $("prompt-input").value = "";
  $("target-repo-input").value = "";
  $("branch-input").value = "main";

  const box = $("status-log");
  box.innerHTML = '<p class="log-placeholder">Agent output will appear here…</p>';
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();

  // Pre-fill platform repo from config
  if (CONFIG.defaultRepo) {
    $("owner-input").value = CONFIG.defaultRepo;
  }

  $("submit-btn").addEventListener("click", handleSubmit);
  $("reset-btn").addEventListener("click", handleReset);

  // Allow Ctrl+Enter to submit from the textarea
  $("prompt-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  });
});
