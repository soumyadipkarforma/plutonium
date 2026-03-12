"""
web_scraper_tool.py – MCP tool for lightweight HTTP-based web scraping.

Uses ``requests`` + ``html.parser`` (stdlib) so that no additional browser
dependencies are required for simple text extraction.  For JavaScript-heavy
pages, use ``playwright_tool`` instead.

Capabilities:
  • Fetch the raw HTML of a URL.
  • Extract visible text from a page.
  • Extract all hyperlinks.
  • Extract <meta> tags (useful for documentation pages).

Plugin interface (required by tool_router):
  name        – "web_scraper"
  description – one-line summary
  run(params) – execute the requested sub-action and return a dict
"""

from __future__ import annotations

import html.parser
import logging
import re
import urllib.parse
from typing import Any

import requests

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Plugin identity
# ---------------------------------------------------------------------------

name: str = "web_scraper"
description: str = "Lightweight HTTP scraping: fetch HTML, extract text, links, and meta tags."


# ---------------------------------------------------------------------------
# Internal HTML parsing helpers
# ---------------------------------------------------------------------------

class _TextExtractor(html.parser.HTMLParser):
    """Extract visible text, skipping <script> and <style> blocks."""

    _SKIP_TAGS = {"script", "style", "head", "meta", "link", "noscript"}

    def __init__(self) -> None:
        super().__init__()
        self._skip = 0
        self.texts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list) -> None:
        if tag.lower() in self._SKIP_TAGS:
            self._skip += 1

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in self._SKIP_TAGS and self._skip:
            self._skip -= 1

    def handle_data(self, data: str) -> None:
        if not self._skip:
            stripped = data.strip()
            if stripped:
                self.texts.append(stripped)


class _LinkExtractor(html.parser.HTMLParser):
    """Extract all href attributes from <a> tags."""

    def __init__(self, base_url: str = "") -> None:
        super().__init__()
        self.base_url = base_url
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list) -> None:
        if tag.lower() == "a":
            href = dict(attrs).get("href", "")
            if href:
                resolved = urllib.parse.urljoin(self.base_url, href)
                self.links.append(resolved)


class _MetaExtractor(html.parser.HTMLParser):
    """Extract <meta name="..." content="..."> tags."""

    def __init__(self) -> None:
        super().__init__()
        self.meta: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list) -> None:
        if tag.lower() == "meta":
            attr_dict = dict(attrs)
            key = attr_dict.get("name") or attr_dict.get("property") or ""
            value = attr_dict.get("content", "")
            if key and value:
                self.meta[key] = value


# ---------------------------------------------------------------------------
# Plugin entry-point
# ---------------------------------------------------------------------------

def run(params: dict[str, Any]) -> dict[str, Any]:
    """
    Execute a web-scraping action.

    Parameters (keys in *params*)
    --------------------------------
    action : str
        One of ``"fetch"`` | ``"text"`` | ``"links"`` | ``"meta"``.
        Defaults to ``"text"``.
    url : str
        Target URL.
    timeout : int
        Request timeout in seconds.  Defaults to 20.

    Returns
    -------
    dict
    """
    action = params.get("action", "text")
    url = params.get("url", "")
    timeout = int(params.get("timeout", 20))

    if not url:
        return {"status": "error", "message": "A 'url' parameter is required."}

    try:
        logger.info("web_scraper fetching: %s (action=%s)", url, action)
        resp = requests.get(
            url,
            timeout=timeout,
            headers={"User-Agent": "MCP-WebScraper/1.0 (+https://github.com/soumyadipkarforma/plutonium)"},
        )
        resp.raise_for_status()
        html_content = resp.text

        if action == "fetch":
            return {"status": "ok", "url": url, "html": html_content[:50_000]}

        elif action == "text":
            extractor = _TextExtractor()
            extractor.feed(html_content)
            text = " ".join(extractor.texts)
            # Collapse excessive whitespace
            text = re.sub(r"\s{3,}", "\n\n", text)
            return {"status": "ok", "url": url, "text": text[:8000]}

        elif action == "links":
            extractor = _LinkExtractor(base_url=url)
            extractor.feed(html_content)
            unique_links = list(dict.fromkeys(extractor.links))  # preserve order, deduplicate
            return {"status": "ok", "url": url, "links": unique_links}

        elif action == "meta":
            extractor = _MetaExtractor()
            extractor.feed(html_content)
            return {"status": "ok", "url": url, "meta": extractor.meta}

        else:
            return {"status": "error", "message": f"Unknown action '{action}'."}

    except requests.HTTPError as exc:
        logger.error("HTTP error while scraping %s: %s", url, exc)
        return {"status": "error", "message": str(exc)}
    except Exception as exc:
        logger.exception("web_scraper_tool error")
        return {"status": "error", "message": str(exc)}
