# Changelog

All notable changes to MXLens are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[semantic versioning](https://semver.org/).

## [1.0.0] — 2026-10-14

First open-source release.

### Added
- `@mxlens/engine`: email parsing, SPF/DKIM/DMARC alignment (Public Suffix List,
  ARC-aware), explainable detection rules mapped to MITRE ATT&CK, noisy-OR
  scoring, and JSON/Markdown/CSV/STIX 2.1 output. Runs in browsers and Node with
  no network calls.
- `mxlens` CLI with text/JSON/Markdown/CSV/STIX output and CI exit codes.
- `@mxlens/mcp` stdio Model Context Protocol server for AI agents.
- `@mxlens/web` browser analyzer (local analysis, sandboxed preview) and
  `POST /api/v1/analyze` REST endpoint.
- Synthetic labeled corpus and a CI accuracy gate.
