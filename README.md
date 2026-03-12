<div align="center">

# ⚛ Plutonium

**Serverless MCP Orchestration Platform**

[![Deploy to GitHub Pages](https://github.com/soumyadipkarforma/plutonium/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/soumyadipkarforma/plutonium/actions/workflows/deploy-pages.yml)
[![MCP Agent Runner](https://github.com/soumyadipkarforma/plutonium/actions/workflows/agent-runner.yml/badge.svg)](https://github.com/soumyadipkarforma/plutonium/actions/workflows/agent-runner.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node 24](https://img.shields.io/badge/Node-24-green.svg)](https://nodejs.org)

*Submit a prompt → GitHub Actions runs an AI agent → code appears in your repo.*

[Live UI](https://soumyadipkarforma.github.io/plutonium/) · [Actions](https://github.com/soumyadipkarforma/plutonium/actions) · [Add a Tool](#adding-a-new-mcp-tool)

</div>

---

## Architecture

```
User (browser)
    │
    │  POST /repos/{owner}/dispatches
    ▼
GitHub API  ──────────────────────────────────────────────────────────┐
                                                                       │
                                                         GitHub Actions │
                                                         ┌─────────────┘
                                                         │
                                                         ▼
                                                   agent-runner.yml
                                                         │
                                          ┌──────────────┼──────────────┐
                                          │              │              │
                                          ▼              ▼              ▼
                                    playwright      web_scraper     github
                                      tool            tool          tool
                                          │              │              │
                                          └──────────────┼──────────────┘
                                                         │
                                                         ▼
                                                    agent.py
                                                 (LLM + tool loop)
                                                         │
                                                         ▼
                                               Target repository
                                               (commit + push)
```

## Repository Structure

```
plutonium/
├── .github/workflows/
│   ├── agent-runner.yml      # Main: triggered by UI dispatch
│   ├── deploy-pages.yml      # Builds & deploys the web UI
│   ├── tool-installer.yml    # Validates all MCP tool plugins
│   ├── repo-writer.yml       # Reusable: commit files to target repo
│   └── nightly-sync.yml      # Daily: update browsers & validate tools
│
├── agent/
│   ├── agent.py              # Entry-point: LLM loop
│   ├── tool_router.py        # Dynamic plugin loader & dispatcher
│   ├── repo_manager.py       # Clone / write / commit / push
│   └── config.py             # All env-var reading in one place
│
├── tools/                    # MCP tool plugins (add yours here!)
│   ├── playwright_tool.py    # Headless browser automation
│   ├── github_tool.py        # GitHub REST API integration
│   ├── filesystem_tool.py    # Local file-system operations
│   └── web_scraper_tool.py   # Lightweight HTML scraping
│
├── web/                      # React 19 + TypeScript + Framer Motion UI
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/       # Animated UI components
│   │   ├── hooks/            # useGitHubDispatch
│   │   └── types/
│   ├── package.json          # Node 24 · Vite 7 · Framer Motion 12
│   └── vite.config.ts
│
├── prompts/
│   ├── system_prompt.md      # System prompt for the AI agent
│   └── coding_prompt.md      # Code-generation prompt template
│
├── scripts/
│   ├── trigger_workflow.js   # CLI helper (Node 24 native fetch)
│   ├── repo_clone.sh         # Clone target repo with PAT
│   └── commit_changes.sh     # Stage + commit + push
│
├── requirements.txt          # Python deps (playwright, gitpython, openai…)
└── LICENSE                   # MIT
```

---

## Quick Start

### 1 · Fork & clone

```bash
git clone https://github.com/soumyadipkarforma/plutonium
cd plutonium
```

### 2 · Configure GitHub Pages

1. Go to **Settings → Pages**
2. Set source to **GitHub Actions**
3. Push to `main` — the `deploy-pages.yml` workflow builds and deploys the UI automatically.

### 3 · Add secrets

| Secret           | Purpose |
|------------------|---------|
| `GH_PAT`         | Personal Access Token with `repo` + `workflow` scopes (used by the agent to clone and push) |
| `OPENAI_API_KEY` | *(Optional)* Required only for real LLM completions. The agent falls back to a stub if absent. |

Add secrets at **Settings → Secrets and variables → Actions**.

### 4 · Use the UI

Open your GitHub Pages URL (e.g. `https://<user>.github.io/plutonium/`), enter:

* **GitHub PAT** – your token (stays in memory, never stored)
* **Platform repo** – `your-username/plutonium`
* **Prompt** – describe what you want the AI to do
* **Target repository** – `owner/repo` where generated files go
* **Branch** – branch to push to

Press **▶ Run Agent**.  The workflow appears in your **Actions** tab within seconds.

---

## Running Locally

### Web UI (dev server)

```bash
cd web
node --version   # must be ≥ 24
npm install
npm run dev      # http://localhost:5173
```

### Python agent

```bash
pip install -r requirements.txt
playwright install chromium

python agent/agent.py \
  --prompt      "Generate a CONTRIBUTING.md" \
  --target-repo owner/my-repo \
  --branch      main
```

### CLI trigger script

```bash
# Uses Node 24 native fetch – no extra deps
GH_PAT=ghp_xxxx node scripts/trigger_workflow.js \
  --repo   your-username/plutonium \
  --prompt "Add a GitHub Actions CI workflow" \
  --target owner/target-repo \
  --branch main
```

---

## Adding a New MCP Tool

1. Create `tools/my_feature_tool.py`
2. Expose exactly three module-level attributes:

```python
name: str        = "my_feature"
description: str = "One-line summary of what this tool does."

def run(params: dict) -> dict:
    """
    Execute the tool.

    params keys:
      action (str) – sub-action to perform
      ...           – tool-specific parameters

    Returns a dict with at minimum {"status": "ok"|"error"}.
    """
    ...
    return {"status": "ok", "result": "..."}
```

3. The `tool_router` loads it automatically on next run — no registration needed.
4. Open a PR so the community can benefit!

---

## Security Considerations

| Topic | Mitigation |
|-------|-----------|
| PAT exposure | The web UI keeps the PAT in JS memory only; it is sent directly to `api.github.com` over HTTPS and never to any third-party server. |
| Agent credentials | `GH_PAT` and `OPENAI_API_KEY` are stored as GitHub Actions secrets and injected as environment variables; they never appear in logs. |
| Commit identity | All bot commits use `ai-mcp@users.noreply.github.com` so they are distinguishable from human commits. |
| Target repo scope | The agent only writes to the repository explicitly specified by the user in each dispatch payload. |
| Prompt injection | Prompts are passed as opaque strings to the LLM — no shell interpolation occurs. |

---

## Workflows Reference

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `agent-runner.yml`  | `repository_dispatch: run_mcp_agent` | Main agent execution |
| `deploy-pages.yml`  | Push to `main` touching `web/**` | Deploy UI to GitHub Pages |
| `tool-installer.yml`| Push touching `tools/**`, manual | Validate tool plugins |
| `repo-writer.yml`   | Manual / reusable workflow call | Write files to target repo |
| `nightly-sync.yml`  | Cron 02:00 UTC | Update browsers, validate tools |

---

## License

MIT © 2024 Soumyadip Kar
