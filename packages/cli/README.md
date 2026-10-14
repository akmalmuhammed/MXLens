# mxlens (CLI)

Analyze an email for phishing from the command line. Local, explainable, with
machine-readable output and CI-friendly exit codes. Part of
[MXLens](https://github.com/akmalmuhammed/mxlens).

```bash
npm install -g mxlens
```

## Usage

```bash
mxlens suspicious.eml                 # human-readable report
mxlens *.eml --format json           # machine-readable, many files
cat mail.eml | mxlens - --quiet      # read stdin, print verdict only
mxlens report.eml -f markdown        # ticket-ready summary
mxlens report.eml -f stix            # STIX 2.1 indicators
mxlens report.eml --trust mx.example.org   # trust only this gateway's auth results
mxlens --rules                       # list detection rules
```

Formats: `text` (default), `json`, `markdown`, `csv`, `stix`.

**Exit codes:** `0` below the threshold, `1` at or above it, `2` on error. The
threshold defaults to `malicious`; set it with `--fail-on suspicious` to be
stricter in a pipeline. Everything runs locally — no network requests.

## License

Apache-2.0
