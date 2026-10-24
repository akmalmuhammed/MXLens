#!/usr/bin/env bash
# Exports the committed tree of HEAD into a new git repository with a single
# commit and no history, for publishing as the public open-source repo.
#
#   scripts/export-public-repo.sh <output-dir>
#
# Uncommitted changes are not exported. Files marked export-ignore in
# .gitattributes are left out.
set -euo pipefail

out="${1:?usage: scripts/export-public-repo.sh <output-dir>}"
root="$(git rev-parse --show-toplevel)"
cd "$root"

if [ -e "$out" ] && [ -n "$(ls -A "$out" 2>/dev/null)" ]; then
  echo "error: $out exists and is not empty" >&2
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "warning: uncommitted changes are not included in the export" >&2
fi

mkdir -p "$out"
git archive --format=tar HEAD | tar -x -C "$out"

# Refuse to publish anything that looks like private data or credentials.
patterns=(
  'postgres(ql)?://[^ "]*@'      # database URLs with credentials
  'neon\.tech'
  'sk_live_[0-9A-Za-z]+'         # Stripe live keys
  'whsec_[0-9A-Za-z]{20,}'
  'BEGIN [A-Z ]*PRIVATE KEY'
  '\$2[aby]\$[0-9]{2}\$'         # bcrypt hashes
  'akmalmuhammed[0-9]*@'         # maintainer's personal email
)
found=0
for p in "${patterns[@]}"; do
  if grep -rInE "$p" "$out" >/dev/null 2>&1; then
    echo "error: export contains a match for /$p/:" >&2
    grep -rInE "$p" "$out" | head -5 >&2
    found=1
  fi
done
stray_eml="$(find "$out" -name '*.eml' -not -path "$out/tests/fixtures/*" -not -path "$out/public/samples/*")"
if [ -n "$stray_eml" ]; then
  echo "error: unexpected .eml files:" >&2
  echo "$stray_eml" >&2
  found=1
fi
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks dir "$out" --redact --no-banner || found=1
else
  echo "note: gitleaks not installed; skipped its scan (CI runs it on every push)" >&2
fi
if [ "$found" -ne 0 ]; then
  echo "Export stopped. Fix the findings above, commit, and re-run." >&2
  rm -rf "$out"
  exit 1
fi

source_commit="$(git rev-parse --short HEAD)"
cd "$out"
git init -q -b main
git add -A
GIT_AUTHOR_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" git commit -q -m "Initial open-source release" \
  -m "MXLens: free, open-source email phishing analyzer. MIT licensed." \
  -m "Exported from private source ${source_commit}."

echo "Exported $(git ls-files | wc -l | tr -d ' ') files to $out as a single commit."
echo "Next: git -C \"$out\" remote add origin git@github.com:akmalmuhammed/mxlens.git && git -C \"$out\" push -u origin main"
