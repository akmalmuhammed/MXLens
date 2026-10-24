# mxlens

Analyze `.eml` files for phishing from the command line. Everything runs locally: the
message is parsed and scored on your machine and nothing is sent over the network.

```bash
npx mxlens demo-phishing.eml
```

```
demo-phishing.eml
  HIGH RISK  risk 89/100  confidence low
  Significant threats or critical authentication failures. (Low data confidence)
  Subject  [DEMO] Sample Phishing Simulation Email
  From     security-team@company.com
  Auth     SPF softfail  DKIM none  DMARC fail  ARC none
  Findings
    critical DMARC Fail
    critical Credential Harvesting Keywords
    high     Hidden Text / CSS Evasion Detected
```

## Usage

```
mxlens [analyze] <file|dir|-> [...more] [options]
```

| Input | |
|---|---|
| `file.eml` | A single message |
| `dir/` | Every `.eml` file in the directory, recursively |
| `-` | One message from stdin |

| Option | |
|---|---|
| `--json` | JSON output: an object for one input, an array for several |
| `--headers-only` | Skip body and attachment analysis |
| `--no-body` | Skip body analysis (links, forms, urgency, hidden text) |
| `--no-attachments` | Skip attachment analysis |
| `--fail-on <level>` | Exit 2 if any message is `suspicious` or `malicious` (or worse) |

Exit codes: `0` ok, `1` usage or read error, `2` `--fail-on` threshold met.

### Examples

```bash
# Triage a folder of reported emails, worst first
mxlens --json reported/ | jq 'sort_by(-.riskScore) | .[] | {input, verdict, riskScore}'

# Use in a script or mail pipeline
mxlens --fail-on malicious - < message.eml || quarantine message.eml
```

## Differences from the web app

The CLI runs the same engine as the [MXLens web app](https://github.com/akmalmuhammed/mxlens)
with two exceptions: it does not extract links from PDF attachments or decode QR codes in
images, since both need browser APIs. It also never performs reputation lookups.

Requires Node.js 20 or later. MIT licensed.
