import {
  getClientIp,
  getImageByteSize,
  isValidApiKey,
  isValidImagePayload,
  MAX_IMAGE_BYTES,
} from "../../api/lib/security";
import type { VercelRequest } from "@vercel/node";
import { createOversizedImageBase64, TINY_IMAGE_BASE64 } from "../fixtures/images";

function createRequest(headers: Record<string, string | undefined> = {}): VercelRequest {
  return { headers } as VercelRequest;
}

describe("api security helpers", () => {
  const originalApiKey = process.env.MACROZONE_API_KEY;

  beforeEach(() => {
    process.env.MACROZONE_API_KEY = "test-api-key";
  });

  afterAll(() => {
    process.env.MACROZONE_API_KEY = originalApiKey;
  });

  it("extracts the first forwarded IP", () => {
    const req = createRequest({ "x-forwarded-for": "203.0.113.1, 10.0.0.2" });
    expect(getClientIp(req)).toBe("203.0.113.1");
  });

  it("rejects missing API key", () => {
    const req = createRequest();
    expect(isValidApiKey(req)).toBe(false);
  });

  it("accepts a valid API key", () => {
    const req = createRequest({ "x-api-key": "test-api-key" });
    expect(isValidApiKey(req)).toBe(true);
  });

  it("computes base64 image size", () => {
    expect(getImageByteSize(TINY_IMAGE_BASE64)).toBeGreaterThan(0);
    expect(getImageByteSize(TINY_IMAGE_BASE64)).toBeLessThan(MAX_IMAGE_BYTES);
  });

  it("rejects oversized image payloads", () => {
    expect(isValidImagePayload(createOversizedImageBase64())).toBe(false);
  });

  it("accepts small image payloads", () => {
    expect(isValidImagePayload(TINY_IMAGE_BASE64)).toBe(true);
  });
});