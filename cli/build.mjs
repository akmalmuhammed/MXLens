// Bundles the CLI and the analysis engine into a single dependency-free file.
import { build } from "esbuild";
import { readFileSync, chmodSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(path.join(here, "package.json"), "utf8"));
const outfile = path.join(here, "dist", "mxlens.mjs");

const browserOnlyStub = {
    name: "browser-only-stub",
    setup(b) {
        b.onResolve({ filter: /utils\/(pdf|qr)\.client$/ }, () => ({
            path: path.join(here, "src", "browser-only.ts"),
        }));
        // QR decoding runs in the CLI too, with the WebAssembly reader embedded.
        b.onResolve({ filter: /utils\/zxing\.loader$/ }, () => ({
            path: path.join(here, "src", "zxing-loader.ts"),
        }));
    },
};

await build({
    entryPoints: [path.join(here, "src", "bin.ts")],
    outfile,
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    tsconfig: path.join(here, "..", "tsconfig.json"),
    define: { __MXLENS_VERSION__: JSON.stringify(version) },
    banner: {
        // Shebang, plus require() for bundled CommonJS dependencies.
        js: "#!/usr/bin/env node\nimport { createRequire as __createRequire } from 'node:module';\nconst require = __createRequire(import.meta.url);",
    },
    plugins: [browserOnlyStub],
    loader: { ".wasm": "binary" },
    minify: true,
    legalComments: "linked",
    logLevel: "warning",
});

chmodSync(outfile, 0o755);
console.log(`Built ${path.relative(process.cwd(), outfile)} (v${version})`);
