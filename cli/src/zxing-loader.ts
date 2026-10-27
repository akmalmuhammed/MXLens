// Replaces src/utils/zxing.loader.ts in the CLI bundle. esbuild's binary loader embeds the
// ZXing WebAssembly reader, so the CLI stays one file and never downloads code at runtime.
import { prepareZXingModule } from "zxing-wasm/reader";
import wasm from "zxing-wasm/reader/zxing_reader.wasm";

let ready: Promise<void> | null = null;

export function ensureZXing(): Promise<void> {
    if (!ready) {
        const bytes = wasm as unknown as Uint8Array;
        const wasmBinary = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
        ready = prepareZXingModule({ overrides: { wasmBinary }, fireImmediately: true }).then(() => undefined);
    }
    return ready;
}
