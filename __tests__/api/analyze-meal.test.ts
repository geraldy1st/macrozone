import handler from "../../api/analyze-meal";
import { isRateLimited } from "../../api/lib/security";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createOversizedImageBase64, TINY_IMAGE_BASE64 } from "../fixtures/images";

jest.mock("../../api/lib/security", () => ({
  ...jest.requireActual("../../api/lib/security"),
  isRateLimited: jest.fn(),
}));

const mockedIsRateLimited = isRateLimited as jest.MockedFunction<typeof isRateLimited>;

type MockResponse = VercelResponse & {
  statusCode: number;
  body: unknown;
  headers: Record<string, string | number>;
};

function createMockResponse(): MockResponse {
  const res = {
    statusCode: 200,
    body: null as unknown,
    headers: {} as Record<string, string | number>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    setHeader(key: string, value: string | number) {
      this.headers[key] = value;
      return this;
    },
    end() {
      return this;
    },
  };

  return res as MockResponse;
}

function createRequest(
  overrides: Partial<VercelRequest> & { body?: Record<string, unknown> } = {},
): VercelRequest {
  return {
    method: "POST",
    headers: { "x-api-key": "test-api-key" },
    body: { image: TINY_IMAGE_BASE64, language: "fr" },
    ...overrides,
  } as VercelRequest;
}

describe("analyze-meal handler", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MACROZONE_API_KEY = "test-api-key";
    process.env.GEMINI_API_KEY = "gemini-test-key";
    mockedIsRateLimited.mockResolvedValue({ limited: false, remaining: 19 });
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns 401 without a valid API key", async () => {
    const res = createMockResponse();
    await handler(createRequest({ headers: {} }), res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when image data is missing", async () => {
    const res = createMockResponse();
    await handler(createRequest({ body: {} }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Missing image data" });
  });

  it("returns 413 for oversized images", async () => {
    const res = createMockResponse();
    await handler(
      createRequest({ body: { image: createOversizedImageBase64() } }),
      res,
    );

    expect(res.statusCode).toBe(413);
    expect(res.body).toEqual({ error: "Image too large" });
  });

  it("returns 429 when rate limited", async () => {
    mockedIsRateLimited.mockResolvedValueOnce({ limited: true, remaining: 0 });
    const res = createMockResponse();

    await handler(createRequest(), res);

    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({ error: "Rate limit exceeded" });
  });

  it("returns parsed meal analysis on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '{"name":"Salade César","calories":420,"protein":18,"carbs":12,"fat":28}',
                },
              ],
            },
          },
        ],
      }),
    });

    const res = createMockResponse();
    await handler(createRequest(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      name: "Salade César",
      calories: 420,
      protein: 18,
      carbs: 12,
      fat: 28,
    });
    expect(res.headers["X-RateLimit-Remaining"]).toBe("19");
  });

  it("returns 429 when Gemini quota is exceeded", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "RESOURCE_EXHAUSTED",
    });

    const res = createMockResponse();
    await handler(createRequest(), res);

    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({ error: "AI quota exceeded" });
  });
});