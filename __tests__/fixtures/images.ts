export const TINY_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export function createOversizedImageBase64(): string {
  return Buffer.alloc(3 * 1024 * 1024, "a").toString("base64");
}