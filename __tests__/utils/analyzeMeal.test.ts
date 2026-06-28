import { analyzeMealPhoto } from "@/utils/analyzeMeal";

jest.mock("@/constants/api", () => ({
  ANALYZE_API_URL: "https://test.api/analyze-meal",
  MACROZONE_API_KEY: "test-api-key",
}));

describe("analyzeMealPhoto", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("maps 401 to UNAUTHORIZED", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ status: 401 });

    await expect(analyzeMealPhoto("abc", "fr")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("maps 413 to IMAGE_TOO_LARGE", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ status: 413 });

    await expect(analyzeMealPhoto("abc", "fr")).rejects.toMatchObject({
      code: "IMAGE_TOO_LARGE",
    });
  });

  it("maps AI quota errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 429,
      json: async () => ({ error: "AI quota exceeded" }),
    });

    await expect(analyzeMealPhoto("abc", "fr")).rejects.toMatchObject({
      code: "AI_QUOTA_EXCEEDED",
    });
  });

  it("maps generic failures to ANALYSIS_FAILED", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 502,
    });

    await expect(analyzeMealPhoto("abc", "fr")).rejects.toMatchObject({
      code: "ANALYSIS_FAILED",
    });
  });

  it("returns parsed analysis on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        name: "Salade",
        calories: 320,
        protein: 12,
        carbs: 18,
        fat: 9,
      }),
    });

    await expect(analyzeMealPhoto("abc", "en")).resolves.toEqual({
      name: "Salade",
      calories: 320,
      protein: 12,
      carbs: 18,
      fat: 9,
    });
  });
});