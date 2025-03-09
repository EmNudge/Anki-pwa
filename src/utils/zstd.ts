import initWasm, { decompress } from "@dweb-browser/zstd-wasm";
import zstd_wasm_url from "@dweb-browser/zstd-wasm/zstd_wasm_bg.wasm?url";

declare module "@dweb-browser/zstd-wasm" {
  export function decompress(data: Uint8Array): Uint8Array;
  export default function initWasm(path: string): Promise<void>;
}

const wasmInit = initWasm(zstd_wasm_url);

export async function decompressZstd(data: Uint8Array) {
  await wasmInit;
  return decompress(data);
}
