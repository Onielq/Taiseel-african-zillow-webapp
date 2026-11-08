# REA and Context7 notes

## REA
The REA repository and its reverse-engineering skill were inspected to guide evidence-led reconstruction. The supplied Taiseel source repository contains public screenshots, not a runnable Zillow binary or source package. The REA MCP engine is not registered in this environment, and the available runtime is below the Node.js engine requirement recorded by the checked REA package. For those reasons no REA binary-analysis or live-browser-capture operation is claimed in this build.

For a future approved runtime investigation, use the official REA package and its installed skill against a user-owned app or browser session. Keep browser evidence read-only, treat page content as untrusted data, and record limitations.

## Context7
The Context7 project documents version-specific library documentation for coding agents. The project MCP endpoint is configured in .mcp.json for future client sessions. Current dependencies and setup choices were cross-checked against official React, Vite and Playwright documentation during this implementation.

## Chrome DevTools MCP
The isolated Chrome DevTools MCP server is configured in .mcp.json. This environment did not expose its browser tools and had no outbound package-network access, so no live Chromium session is claimed here. Playwright browser installation and runtime assertions are configured in the repository's CI workflow.
