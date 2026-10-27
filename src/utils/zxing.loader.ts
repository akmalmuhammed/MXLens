import { prepareZXingModule } from "zxing-wasm/reader";

/**
 * Loads the ZXing-C++ WebAssembly QR/barcode reader without ever fetching it from a CDN
 * (zxing-wasm's default). Browsers load the copy webpack emits next to the app; Node
 * (tests, scripts) reads it from node_modules. The CLI bundle swaps this module for
 * cli/src/zxing-loader.ts, which embeds the binary.
 *
 * Browsers need `'wasm-unsafe-eval'` in the CSP script-src to compile WebAssembly.
 */
let ready: Promise<void> | null = null;

export function ensureZXing(): Promise<void> {
    if (!ready) {
        ready = (async () => {
            if (typeof window === "undefined") {
                const { readFile } = await import(/* webpackIgnore: true */ "node:fs/promises");
                const { createRequire } = await import(/* webpackIgnore: true */ "node:module");
                const req = createRequire(import.meta.url);
                const wasmBinary = await readFile(req.resolve("zxing-wasm/reader/zxing_reader.wasm"));
                await prepareZXingModule({ overrides: { wasmBinary: new Uint8Array(wasmBinary).buffer }, fireImmediately: true });
            } else {
                const wasmUrl = new URL("zxing-wasm/reader/zxing_reader.wasm", import.meta.url).href;
                await prepareZXingModule({
                    overrides: { locateFile: (file: string, prefix: string) => (file.endsWith(".wasm") ? wasmUrl : prefix + file) },
                    fireImmediately: true
                });
            }
        })().catch(err => {
            ready = null;
            throw err;
        });
    }
    return ready;
}
