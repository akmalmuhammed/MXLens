/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/index/determineVerdictWasm
 * @param trustScore `i32`
 * @param confidenceScore `i32`
 * @param criticalFlags `i32`
 * @returns `i32`
 */
export declare function determineVerdictWasm(trustScore: number, confidenceScore: number, criticalFlags: number): number;
