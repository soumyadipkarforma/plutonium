#!/usr/bin/env bash
# commit_changes.sh – stage, commit, and push all changes in a cloned repo.
#
# Usage:
#   bash scripts/commit_changes.sh <owner/repo> <branch> [commit-message]
#
# Environment:
#   GH_PAT        – GitHub Personal Access Token (required)
#   CLONE_BASE_DIR – base directory for clones (default: /tmp/mcp_repos)

set -euo pipefail

REPO="${1:?Usage: $0 <owner/repo> <branch> [message]}"
BRANCH="${2:-main}"
MSG="${3:-chore: apply AI-generated changes}"
BASE_DIR="${CLONE_BASE_DIR:-/tmp/mcp_repos}"
PAT="${GH_PAT:?GH_PAT environment variable is required}"

REPO_NAME="${REPO##*/}"
CLONE_PATH="${BASE_DIR}/${REPO_NAME}"

if [[ ! -d "${CLONE_PATH}" ]]; then
  echo "[commit_changes] ERROR: Clone not found at ${CLONE_PATH}" >&2
  exit 1
fi

cd "${CLONE_PATH}"

# Stage everything
git add --all

# Check for staged changes
if git diff --cached --quiet; then
  echo "[commit_changes] Nothing to commit – working tree is clean."
  exit 0
fi

git commit --message "${MSG}"

# Re-authenticate remote URL before push
CURRENT_URL="$(git remote get-url origin)"
if [[ "${CURRENT_URL}" == *"github.com"* ]]; then
  SLUG="${CURRENT_URL#*github.com/}"
  SLUG="${SLUG%*.git}"
  SLUG="${SLUG#:}"
  AUTH_URL="https://x-access-token:${PAT}@github.com/${SLUG}.git"
  git remote set-url origin "${AUTH_URL}"
fi

echo "[commit_changes] Pushing to origin/${BRANCH}…"
git push origin "HEAD:${BRANCH}"
echo "[commit_changes] Push complete."
