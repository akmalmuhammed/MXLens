# @mxlens/web

The MXLens web analyzer and REST API. Drop an email, get an explained phishing
verdict — parsing and scoring run in your browser, so the message is never
uploaded. Part of [MXLens](https://github.com/akmalmuhammed/mxlens).

## Run locally

```bash
npm install        # from the repo root
npm run web        # http://localhost:3000
```

## REST API

`POST /api/v1/analyze` — send a raw email as `text/plain` or `message/rfc822`, or
JSON `{ "email": "<raw>", "trustedAuthservIds"?: [], "format"?: "json"|"stix" }`.
Add `?format=stix` for a STIX 2.1 bundle. The endpoint runs the engine
server-side and does not store what it receives.

```bash
curl -X POST http://localhost:3000/api/v1/analyze \
  -H "content-type: message/rfc822" --data-binary @suspicious.eml
```

## Deploy

Deploys to any Node host or to Vercel. It is a standard Next.js app; the engine
is bundled from the workspace.

## License

Apache-2.0
