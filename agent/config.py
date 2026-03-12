"""
config.py – Centralised configuration for the MCP orchestration agent.

All environment-variable reading happens here so that other modules can
import typed constants without scattering os.environ calls throughout the
codebase.
"""

import os

# ---------------------------------------------------------------------------
# GitHub / VCS
# ---------------------------------------------------------------------------

#: Personal Access Token used to clone repos and push commits.
#: Injected by GitHub Actions from the GH_PAT secret.
GH_PAT: str = os.environ.get("GH_PAT", "")

#: Git author name used for bot commits.
GIT_AUTHOR_NAME: str = "AI MCP Bot"

#: Git author email used for bot commits.
GIT_AUTHOR_EMAIL: str = "ai-mcp@users.noreply.github.com"

# ---------------------------------------------------------------------------
# LLM / OpenAI
# ---------------------------------------------------------------------------

#: OpenAI API key.  Optional – only required when the code-generation tool is
#: actually used.
OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY", "")

#: Default model used for code generation.
OPENAI_MODEL: str = os.environ.get("OPENAI_MODEL", "gpt-4o")

#: Maximum tokens per LLM completion.
OPENAI_MAX_TOKENS: int = int(os.environ.get("OPENAI_MAX_TOKENS", "4096"))

# ---------------------------------------------------------------------------
# File-system paths
# ---------------------------------------------------------------------------

#: Local directory where target repositories are cloned.
CLONE_BASE_DIR: str = os.environ.get("CLONE_BASE_DIR", "/tmp/mcp_repos")

#: Directory containing MCP tool plugins.
TOOLS_DIR: str = os.path.join(os.path.dirname(__file__), "..", "tools")

# ---------------------------------------------------------------------------
# Agent behaviour
# ---------------------------------------------------------------------------

#: Maximum number of tool-execution cycles per agent run (prevents runaway loops).
MAX_ITERATIONS: int = int(os.environ.get("MAX_ITERATIONS", "10"))

#: Timeout in seconds for individual tool calls.
TOOL_TIMEOUT_SECONDS: int = int(os.environ.get("TOOL_TIMEOUT_SECONDS", "120"))
