"""
github_tool.py – MCP tool for interacting with GitHub repositories.

Capabilities:
  • Fetch a file's raw content from any public repository.
  • List files in a directory tree (uses the Git Trees API).
  • Search code across GitHub using the Search API.
  • Retrieve repository metadata.

Plugin interface (required by tool_router):
  name        – "github"
  description – one-line summary
  run(params) – execute the requested sub-action and return a dict
"""

from __future__ import annotations

import logging
import os
from typing import Any

import requests

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Plugin identity
# ---------------------------------------------------------------------------

name: str = "github"
description: str = "GitHub API integration: fetch files, list repos, search code."

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_GITHUB_API = "https://api.github.com"


def _headers() -> dict[str, str]:
    """Return request headers, including a PAT if available."""
    pat = os.environ.get("GH_PAT", "")
    headers: dict[str, str] = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if pat:
        headers["Authorization"] = f"Bearer {pat}"
    return headers


def _get(url: str, params: dict | None = None) -> dict | list:
    resp = requests.get(url, headers=_headers(), params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


# ---------------------------------------------------------------------------
# Plugin entry-point
# ---------------------------------------------------------------------------

def run(params: dict[str, Any]) -> dict[str, Any]:
    """
    Execute a GitHub API action.

    Parameters (keys in *params*)
    --------------------------------
    action : str
        One of ``"get_file"`` | ``"list_files"`` | ``"search_code"`` | ``"repo_info"``.
        Defaults to ``"repo_info"``.
    repo : str
        Repository in ``owner/name`` format.
    path : str
        File or directory path inside the repository.
    ref : str
        Git ref (branch/tag/SHA).  Defaults to the repo's default branch.
    query : str
        Search query (only used when ``action="search_code"``).

    Returns
    -------
    dict
    """
    action = params.get("action", "repo_info")
    repo = params.get("repo", "")

    try:
        if action == "repo_info":
            if not repo:
                return {"status": "error", "message": "'repo' is required for action='repo_info'."}
            data = _get(f"{_GITHUB_API}/repos/{repo}")
            return {
                "status": "ok",
                "repo": repo,
                "description": data.get("description"),
                "default_branch": data.get("default_branch"),
                "stars": data.get("stargazers_count"),
                "language": data.get("language"),
                "url": data.get("html_url"),
            }

        elif action == "get_file":
            path = params.get("path", "")
            ref = params.get("ref", "")
            if not repo or not path:
                return {"status": "error", "message": "'repo' and 'path' are required."}
            url = f"{_GITHUB_API}/repos/{repo}/contents/{path}"
            query_params = {"ref": ref} if ref else {}
            data = _get(url, params=query_params)
            if isinstance(data, dict) and data.get("encoding") == "base64":
                import base64
                content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
            else:
                content = str(data)
            return {"status": "ok", "repo": repo, "path": path, "content": content}

        elif action == "list_files":
            path = params.get("path", "")
            ref = params.get("ref", "")
            if not repo:
                return {"status": "error", "message": "'repo' is required."}
            url = f"{_GITHUB_API}/repos/{repo}/git/trees/HEAD"
            query_params: dict = {"recursive": "1"}
            if ref:
                query_params["ref"] = ref
            data = _get(url, params=query_params)
            if isinstance(data, dict):
                tree = data.get("tree", [])
                files = [
                    item["path"] for item in tree
                    if item.get("type") == "blob"
                    and (not path or item["path"].startswith(path))
                ]
                return {"status": "ok", "repo": repo, "files": files}
            return {"status": "error", "message": "Unexpected API response format."}

        elif action == "search_code":
            query = params.get("query", "")
            if not query:
                return {"status": "error", "message": "'query' is required for action='search_code'."}
            if repo:
                query = f"{query} repo:{repo}"
            data = _get(f"{_GITHUB_API}/search/code", params={"q": query, "per_page": 10})
            items = []
            if isinstance(data, dict):
                for item in data.get("items", []):
                    items.append({
                        "name": item.get("name"),
                        "path": item.get("path"),
                        "repo": item.get("repository", {}).get("full_name"),
                        "url": item.get("html_url"),
                    })
            return {"status": "ok", "results": items}

        else:
            return {"status": "error", "message": f"Unknown action '{action}'."}

    except requests.HTTPError as exc:
        logger.error("GitHub API error: %s", exc)
        return {"status": "error", "message": str(exc)}
    except Exception as exc:
        logger.exception("github_tool error")
        return {"status": "error", "message": str(exc)}
