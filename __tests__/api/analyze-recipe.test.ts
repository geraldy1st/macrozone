import handler from "../../api/analyze-recipe";
import { isRateLimited, resolveRequestIdentity } from "../../api/lib/security";
import type { VercelRequest, VercelResponse } from "@vercel/node";

jest.mock("../../api/lib/security", () => ({
  ...jest.requireActual("../../api/lib/security"),
  isRateLimited: jest.fn(),
  resolveRequestIdentity: jest.fn(),
}));

const mockedIsRateLimited = isRateLimited as jest.MockedFunction<typeof isRateLimited>;
const mockedResolveRequestIdentity = resolveRequestIdentity as jest.MockedFunction<
  typeof resolveRequestIdentity
>;

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
    headers: { authorization: "Bearer test-token" },
    body: {
      recipe:
        "200g chicken breast, 150g rice, 1 tbsp olive oil. Grill chicken and serve with rice.",
      language: "en",
    },
    ...overrides,
  } as VercelRequest;
}

describe("analyze-recipe handler", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = "gemini-test-key";
    mockedIsRateLimited.mockResolvedValue({ limited: false, remaining: 19 });
    mockedResolveRequestIdentity.mockResolvedValue({
      id: "user-123",
      source: "user",
    });
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns 401 without authentication", async () => {
    mockedResolveRequestIdentity.mockResolvedValueOnce(null);
    const res = createMockResponse();

    await handler(createRequest(), res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when recipe text is incomplete", async () => {
    const res = createMockResponse();

    await handler(createRequest({ body: { recipe: "rice" } }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Recipe text too short" });
  });

  it("returns parsed recipe analysis on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    calories: 520,
                    protein: 42,
                    carbs: 48,
                    fat: 12,
                    recipe: "200g chicken\n150g rice",
                  }),
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
      calories: 520,
      protein: 42,
      carbs: 48,
      fat: 12,
      recipe: "200g chicken\n150g rice",
    });
    expect(res.headers["X-RateLimit-Remaining"]).toBe("19");
  });

  it("returns 502 when AI analysis fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "internal error",
    });

    const res = createMockResponse();
    await handler(createRequest(), res);

    expect(res.statusCode).toBe(502);
    expect(res.body).toEqual({ error: "AI analysis failed" });
  });
});