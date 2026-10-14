---
name: False positive
about: A legitimate email MXLens flagged
labels: false-positive
---

**What MXLens said:** verdict, risk score, and which finding(s) fired.

**Why it is legitimate:** what makes this normal mail.

**Synthetic reproduction:** a minimal `.eml` (example.com/org/net, RFC 5737 IPs)
that reproduces the false positive. Remove all real data.

```
(paste the synthetic .eml here)
```

**Version:** output of `mxlens --version`.
