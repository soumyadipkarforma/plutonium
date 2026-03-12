"""
repo_manager.py – Handles all interactions with the target Git repository.

Responsibilities:
  • Clone a remote repository using a GitHub PAT.
  • Create or modify files in the local clone.
  • Stage, commit, and push changes back to origin.

All commits use the bot identity configured in ``agent/config.py``.
"""

from __future__ import annotations

import logging
import os
import pathlib
import shutil
import subprocess
from typing import Union

from agent.config import (
    CLONE_BASE_DIR,
    GH_PAT,
    GIT_AUTHOR_EMAIL,
    GIT_AUTHOR_NAME,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _authenticated_url(repo: str, pat: str) -> str:
    """Return an HTTPS clone URL with the PAT embedded for authentication."""
    return f"https://x-access-token:{pat}@github.com/{repo}.git"


def _run(cmd: list[str], cwd: str | None = None, check: bool = True) -> subprocess.CompletedProcess:
    """Run a subprocess command, streaming output to the logger."""
    logger.debug("Running: %s (cwd=%s)", " ".join(cmd), cwd)
    result = subprocess.run(
        cmd,
        cwd=cwd,
        capture_output=True,
        text=True,
    )
    if result.stdout:
        logger.debug("stdout: %s", result.stdout.strip())
    if result.stderr:
        logger.debug("stderr: %s", result.stderr.strip())
    if check and result.returncode != 0:
        raise subprocess.CalledProcessError(
            result.returncode, cmd, result.stdout, result.stderr
        )
    return result


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def clone(repo: str, branch: str = "main", pat: str = "") -> pathlib.Path:
    """
    Clone *repo* (``owner/name``) into a local directory and return the path.

    If a clone already exists at the expected location it is removed first so
    each run starts from a clean state.

    Parameters
    ----------
    repo:
        GitHub repository in ``owner/name`` format.
    branch:
        Branch to checkout after cloning.
    pat:
        GitHub Personal Access Token.  Falls back to ``GH_PAT`` from config.

    Returns
    -------
    pathlib.Path
        Absolute path to the local clone.
    """
    pat = pat or GH_PAT
    if not pat:
        raise ValueError("A GitHub PAT is required to clone repositories.")

    repo_name = repo.split("/")[-1]
    clone_path = pathlib.Path(CLONE_BASE_DIR) / repo_name

    # Remove stale clone if present
    if clone_path.exists():
        logger.info("Removing existing clone at %s", clone_path)
        shutil.rmtree(clone_path)

    clone_path.parent.mkdir(parents=True, exist_ok=True)

    url = _authenticated_url(repo, pat)
    logger.info("Cloning %s (branch: %s) → %s", repo, branch, clone_path)
    _run(["git", "clone", "--branch", branch, "--depth", "1", url, str(clone_path)])

    # Configure bot identity in the local clone
    _run(["git", "config", "user.name", GIT_AUTHOR_NAME], cwd=str(clone_path))
    _run(["git", "config", "user.email", GIT_AUTHOR_EMAIL], cwd=str(clone_path))

    return clone_path


def write_file(clone_path: Union[str, pathlib.Path], relative_path: str, content: str) -> None:
    """
    Write *content* to *relative_path* inside the cloned repository.

    Parent directories are created automatically.

    Parameters
    ----------
    clone_path:
        Absolute path to the local clone (returned by :func:`clone`).
    relative_path:
        Path of the file relative to the repository root.
    content:
        File content as a string.
    """
    target = pathlib.Path(clone_path) / relative_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    logger.info("Wrote %d chars → %s", len(content), target)


def commit_and_push(
    clone_path: Union[str, pathlib.Path],
    branch: str,
    message: str = "chore: apply AI-generated changes",
    pat: str = "",
) -> None:
    """
    Stage all changes, create a commit, and push to *branch* on origin.

    Parameters
    ----------
    clone_path:
        Absolute path to the local clone.
    branch:
        Remote branch to push to.
    message:
        Commit message.
    pat:
        GitHub Personal Access Token.
    """
    pat = pat or GH_PAT
    cwd = str(clone_path)

    # Stage everything
    _run(["git", "add", "--all"], cwd=cwd)

    # Check whether there is anything to commit
    status = _run(["git", "status", "--porcelain"], cwd=cwd, check=False)
    if not status.stdout.strip():
        logger.info("Nothing to commit in %s – skipping push.", cwd)
        return

    _run(["git", "commit", "--message", message], cwd=cwd)

    # Update the remote URL to include the PAT (ensures authentication)
    # We read the existing remote URL to get the repo slug
    remote_url_result = _run(["git", "remote", "get-url", "origin"], cwd=cwd)
    original_url = remote_url_result.stdout.strip()

    # Extract owner/repo from URL (handles both https and ssh)
    # e.g. https://github.com/owner/repo.git or git@github.com:owner/repo.git
    if "github.com" in original_url:
        slug = original_url.split("github.com")[-1].lstrip("/:").removesuffix(".git")
        auth_url = _authenticated_url(slug, pat)
        _run(["git", "remote", "set-url", "origin", auth_url], cwd=cwd)

    logger.info("Pushing to origin/%s …", branch)
    _run(["git", "push", "origin", f"HEAD:{branch}"], cwd=cwd)
    logger.info("Push complete.")
