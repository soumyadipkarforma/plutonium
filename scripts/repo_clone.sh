#!/usr/bin/env bash
# repo_clone.sh – clone a GitHub repository using a PAT.
#
# Usage:
#   bash scripts/repo_clone.sh <owner/repo> <branch>
#
# Environment:
#   GH_PAT        – GitHub Personal Access Token (required)
#   CLONE_BASE_DIR – base directory for clones (default: /tmp/mcp_repos)

set -euo pipefail

REPO="${1:?Usage: $0 <owner/repo> <branch>}"
BRANCH="${2:-main}"
BASE_DIR="${CLONE_BASE_DIR:-/tmp/mcp_repos}"
PAT="${GH_PAT:?GH_PAT environment variable is required}"

REPO_NAME="${REPO##*/}"
CLONE_PATH="${BASE_DIR}/${REPO_NAME}"

# Remove stale clone
if [[ -d "${CLONE_PATH}" ]]; then
  echo "[repo_clone] Removing existing clone: ${CLONE_PATH}"
  rm -rf "${CLONE_PATH}"
fi

mkdir -p "${BASE_DIR}"

AUTH_URL="https://x-access-token:${PAT}@github.com/${REPO}.git"

echo "[repo_clone] Cloning ${REPO} (branch: ${BRANCH}) → ${CLONE_PATH}"
git clone --branch "${BRANCH}" --depth 1 "${AUTH_URL}" "${CLONE_PATH}"

# Configure bot identity
git -C "${CLONE_PATH}" config user.name  "AI MCP Bot"
git -C "${CLONE_PATH}" config user.email "ai-mcp@users.noreply.github.com"

echo "[repo_clone] Done. Clone path: ${CLONE_PATH}"
echo "CLONE_PATH=${CLONE_PATH}" >> "${GITHUB_ENV:-/dev/null}" 2>/dev/null || true
