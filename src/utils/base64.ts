/** Convert a base64 string to Uint8Array for Supabase Storage uploads on native. */
export function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/^data:[^;]+;base64,/, "");

  if (typeof globalThis.atob === "function") {
    const binary = globalThis.atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // Node / Jest fallback
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const buffer = Buffer.from(clean, "base64");
  return new Uint8Array(buffer);
}
