# @mxlens/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that lets an
AI agent analyze an email for phishing **locally** — the message is parsed and
scored in-process and never sent anywhere. Part of
[MXLens](https://github.com/akmalmuhammed/mxlens).

## Use with an MCP client

```jsonc
{
  "mcpServers": {
    "mxlens": { "command": "npx", "args": ["-y", "@mxlens/mcp"] }
  }
}
```

Or install it and point your client at the `mxlens-mcp` command:

```bash
npm install -g @mxlens/mcp
```

## Tools

- **`analyze_email`** — analyze a raw email (`.eml`/MIME text, or base64).
  Returns a verdict, risk score, explained findings with ATT&CK techniques,
  authentication results and indicators. Formats: `summary`, `full`, `markdown`,
  `stix`. Optional `trustedAuthservIds` to trust only your gateway's auth results.
- **`list_rules`** — list every detection rule with severity, description, known
  false positives and ATT&CK mapping.

Both tools are read-only and make no network calls.

## License

Apache-2.0
