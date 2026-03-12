"""
filesystem_tool.py – MCP tool for local file-system operations.

Capabilities:
  • Read file contents.
  • Write file contents (creates parent directories as needed).
  • List files in a directory (optionally recursive).
  • Delete a file.
  • Check whether a path exists.

Plugin interface (required by tool_router):
  name        – "filesystem"
  description – one-line summary
  run(params) – execute the requested sub-action and return a dict
"""

from __future__ import annotations

import logging
import pathlib
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Plugin identity
# ---------------------------------------------------------------------------

name: str = "filesystem"
description: str = "Local file-system operations: read, write, list, and delete files."


# ---------------------------------------------------------------------------
# Plugin entry-point
# ---------------------------------------------------------------------------

def run(params: dict[str, Any]) -> dict[str, Any]:
    """
    Execute a file-system action.

    Parameters (keys in *params*)
    --------------------------------
    action : str
        One of ``"read"`` | ``"write"`` | ``"list"`` | ``"delete"`` | ``"exists"``.
        Defaults to ``"read"``.
    path : str
        Target file or directory path.
    content : str
        File content (only used for ``action="write"``).
    recursive : bool
        When ``True`` and ``action="list"``, recurse into sub-directories.

    Returns
    -------
    dict
    """
    action = params.get("action", "read")
    raw_path = params.get("path", "")

    if not raw_path:
        return {"status": "error", "message": "A 'path' parameter is required."}

    target = pathlib.Path(raw_path)

    try:
        if action == "read":
            if not target.is_file():
                return {"status": "error", "message": f"File not found: {target}"}
            content = target.read_text(encoding="utf-8", errors="replace")
            return {"status": "ok", "path": str(target), "content": content}

        elif action == "write":
            content = params.get("content", "")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
            logger.info("filesystem_tool: wrote %d chars → %s", len(content), target)
            return {"status": "ok", "path": str(target), "bytes_written": len(content.encode())}

        elif action == "list":
            if not target.exists():
                return {"status": "error", "message": f"Path not found: {target}"}
            recursive: bool = bool(params.get("recursive", False))
            if recursive:
                files = [str(p) for p in sorted(target.rglob("*")) if p.is_file()]
            else:
                files = [str(p) for p in sorted(target.iterdir())]
            return {"status": "ok", "path": str(target), "entries": files}

        elif action == "delete":
            if not target.exists():
                return {"status": "error", "message": f"Path not found: {target}"}
            if target.is_file():
                target.unlink()
            else:
                import shutil
                shutil.rmtree(target)
            logger.info("filesystem_tool: deleted %s", target)
            return {"status": "ok", "path": str(target), "deleted": True}

        elif action == "exists":
            return {"status": "ok", "path": str(target), "exists": target.exists()}

        else:
            return {"status": "error", "message": f"Unknown action '{action}'."}

    except PermissionError as exc:
        return {"status": "error", "message": f"Permission denied: {exc}"}
    except Exception as exc:
        logger.exception("filesystem_tool error")
        return {"status": "error", "message": str(exc)}
