import { ANALYZE_API_URL, MACROZONE_API_KEY } from "@/constants/api";

export type MealAnalysis = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type AnalyzeMealErrorCode =
  | "API_NOT_CONFIGURED"
  | "UNAUTHORIZED"
  | "IMAGE_TOO_LARGE"
  | "RATE_LIMITED"
  | "ANALYSIS_FAILED";

export class AnalyzeMealError extends Error {
  code: AnalyzeMealErrorCode;

  constructor(code: AnalyzeMealErrorCode) {
    super(code);
    this.code = code;
  }
}

export async function analyzeMealPhoto(
  imageBase64: string,
  language: "en" | "fr",
): Promise<MealAnalysis> {
  if (!ANALYZE_API_URL || !MACROZONE_API_KEY) {
    throw new AnalyzeMealError("API_NOT_CONFIGURED");
  }

  const response = await fetch(ANALYZE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": MACROZONE_API_KEY,
    },
    body: JSON.stringify({
      image: imageBase64,
      language,
    }),
  });

  if (response.status === 401) {
    throw new AnalyzeMealError("UNAUTHORIZED");
  }

  if (response.status === 413) {
    throw new AnalyzeMealError("IMAGE_TOO_LARGE");
  }

  if (response.status === 429) {
    throw new AnalyzeMealError("RATE_LIMITED");
  }

  if (!response.ok) {
    throw new AnalyzeMealError("ANALYSIS_FAILED");
  }

  const data = (await response.json()) as MealAnalysis;
  return data;
}