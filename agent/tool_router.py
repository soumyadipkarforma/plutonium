"""
tool_router.py – Dynamic MCP tool loader and dispatcher.

The router scans the ``tools/`` directory at start-up and registers every
Python module that matches the ``*_tool.py`` naming convention.  Each tool
module must expose three module-level attributes:

``name``        (str)  – unique identifier, e.g. ``"playwright"``
``description`` (str)  – one-line human-readable summary
``run``         (callable) – ``run(params: dict) -> dict``

The ``route()`` function selects the best-matching tool for a given task
description and delegates execution to it.
"""

from __future__ import annotations

import importlib
import importlib.util
import logging
import pathlib
import sys
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal registry
# ---------------------------------------------------------------------------

# Mapping of tool name → module object
_REGISTRY: dict[str, Any] = {}


def _load_tools(tools_dir: str | pathlib.Path | None = None) -> None:
    """Import every ``*_tool.py`` module found in *tools_dir* and register it."""
    if tools_dir is None:
        tools_dir = pathlib.Path(__file__).resolve().parent.parent / "tools"
    tools_path = pathlib.Path(tools_dir)

    # Ensure the directory is on the import path
    tools_parent = str(tools_path.parent)
    if tools_parent not in sys.path:
        sys.path.insert(0, tools_parent)

    for tool_file in sorted(tools_path.glob("*_tool.py")):
        module_name = f"tools.{tool_file.stem}"
        try:
            mod = importlib.import_module(module_name)
        except Exception:
            logger.exception("Failed to import tool module %s", module_name)
            continue

        # Validate required interface
        missing = [attr for attr in ("name", "description", "run") if not hasattr(mod, attr)]
        if missing:
            logger.warning(
                "Tool module %s is missing attributes %s – skipped.",
                module_name,
                missing,
            )
            continue

        _REGISTRY[mod.name] = mod
        logger.debug("Registered tool: %s – %s", mod.name, mod.description)

    logger.info("Loaded %d MCP tool(s): %s", len(_REGISTRY), list(_REGISTRY.keys()))


# Load tools on module import
_load_tools()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def list_tools() -> list[dict[str, str]]:
    """Return a list of ``{name, description}`` dicts for all registered tools."""
    return [{"name": mod.name, "description": mod.description} for mod in _REGISTRY.values()]


def get_tool(name: str) -> Any:
    """Return the tool module with the given *name*, or ``None``."""
    return _REGISTRY.get(name)


def route(task: str, params: dict | None = None) -> dict:
    """
    Select the most appropriate tool for *task* and execute it.

    Selection strategy (simple keyword matching – extend as needed):

    * ``"browse"`` / ``"playwright"`` / ``"screenshot"`` → playwright tool
    * ``"github"`` / ``"repo"`` / ``"clone"``           → github tool
    * ``"file"`` / ``"read"`` / ``"write"`` / ``"fs"``  → filesystem tool
    * ``"scrape"`` / ``"html"`` / ``"web"``             → web_scraper tool
    * anything else                                       → first available tool

    Parameters
    ----------
    task:
        Short description of what needs to be done.
    params:
        Arbitrary keyword arguments passed through to ``tool.run()``.

    Returns
    -------
    dict
        The result returned by the selected tool's ``run()`` function.
    """
    params = params or {}

    task_lower = task.lower()

    # Keyword → tool name mapping (order matters – first match wins)
    routing_table: list[tuple[list[str], str]] = [
        (["browse", "playwright", "screenshot", "headless"], "playwright"),
        (["github", "clone", "repository", "pr", "pull request"], "github"),
        (["file", "read", "write", "filesystem", "fs", "directory"], "filesystem"),
        (["scrape", "html", "webpage", "url", "http"], "web_scraper"),
    ]

    selected_name: str | None = None
    for keywords, tool_name in routing_table:
        if any(kw in task_lower for kw in keywords) and tool_name in _REGISTRY:
            selected_name = tool_name
            break

    # Fall back to the first registered tool if no keyword matched
    if selected_name is None and _REGISTRY:
        selected_name = next(iter(_REGISTRY))
        logger.warning(
            "No matching tool for task '%s' – falling back to '%s'.", task, selected_name
        )

    if selected_name is None:
        raise RuntimeError("No MCP tools are registered.  Cannot route task.")

    tool = _REGISTRY[selected_name]
    logger.info("Routing task '%s' → tool '%s'", task, selected_name)

    result = tool.run({"task": task, **params})
    return result
