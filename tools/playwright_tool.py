"""
playwright_tool.py – MCP tool for headless browser automation.

Capabilities:
  • Open any URL and return the rendered page content.
  • Take a full-page screenshot (saved to /tmp).
  • Extract all links from a page.
  • Run an arbitrary JavaScript snippet and return the result.

Plugin interface (required by tool_router):
  name        – "playwright"
  description – one-line summary
  run(params) – execute the requested sub-action and return a dict
"""

from __future__ import annotations

import logging
import pathlib
import tempfile
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Plugin identity (required by tool_router)
# ---------------------------------------------------------------------------

name: str = "playwright"
description: str = "Headless browser automation: browse URLs, screenshot pages, extract links."


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_browser():
    """Launch a headless Chromium instance and return (playwright, browser, page)."""
    from playwright.sync_api import sync_playwright  # type: ignore

    pw = sync_playwright().start()
    browser = pw.chromium.launch(headless=True)
    page = browser.new_page()
    return pw, browser, page


# ---------------------------------------------------------------------------
# Plugin entry-point
# ---------------------------------------------------------------------------

def run(params: dict[str, Any]) -> dict[str, Any]:
    """
    Execute a Playwright action.

    Parameters (keys in *params*)
    --------------------------------
    action : str
        One of ``"navigate"`` | ``"screenshot"`` | ``"links"`` | ``"js"``.
        Defaults to ``"navigate"``.
    url : str
        Target URL.
    script : str
        JavaScript to evaluate (only used when ``action="js"``).
    output_path : str | None
        Where to save the screenshot file.  Defaults to a temp file.

    Returns
    -------
    dict
        ``{"status": "ok", ...}`` or ``{"status": "error", "message": "..."}``.
    """
    action = params.get("action", "navigate")
    url = params.get("url", "")

    if not url:
        return {"status": "error", "message": "A 'url' parameter is required."}

    pw = browser = page = None
    try:
        pw, browser, page = _get_browser()
        logger.info("Playwright navigating to: %s", url)
        page.goto(url, wait_until="networkidle", timeout=30_000)

        if action == "navigate":
            text = page.inner_text("body")
            return {"status": "ok", "url": url, "text": text[:8000]}

        elif action == "screenshot":
            output_path = params.get(
                "output_path",
                str(pathlib.Path(tempfile.gettempdir()) / "mcp_screenshot.png"),
            )
            page.screenshot(path=output_path, full_page=True)
            logger.info("Screenshot saved to %s", output_path)
            return {"status": "ok", "path": output_path}

        elif action == "links":
            links = page.eval_on_selector_all(
                "a[href]", "elements => elements.map(el => el.href)"
            )
            return {"status": "ok", "url": url, "links": links}

        elif action == "js":
            script = params.get("script", "")
            if not script:
                return {"status": "error", "message": "A 'script' parameter is required for action='js'."}
            result = page.evaluate(script)
            return {"status": "ok", "result": result}

        else:
            return {"status": "error", "message": f"Unknown action '{action}'."}

    except Exception as exc:
        logger.exception("Playwright tool error")
        return {"status": "error", "message": str(exc)}

    finally:
        if page:
            page.close()
        if browser:
            browser.close()
        if pw:
            pw.stop()
