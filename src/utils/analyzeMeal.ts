import { ANALYZE_API_URL } from "@/constants/api";

export type MealAnalysis = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type AnalyzeMealErrorCode =
  | "API_NOT_CONFIGURED"
  | "AUTH_REQUIRED"
  | "UNAUTHORIZED"
  | "IMAGE_TOO_LARGE"
  | "RATE_LIMITED"
  | "AI_QUOTA_EXCEEDED"
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
  accessToken?: string,
): Promise<MealAnalysis> {
  if (!ANALYZE_API_URL) {
    throw new AnalyzeMealError("API_NOT_CONFIGURED");
  }

  if (!accessToken) {
    throw new AnalyzeMealError("AUTH_REQUIRED");
  }

  const response = await fetch(ANALYZE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
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
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (body?.error === "AI quota exceeded") {
      throw new AnalyzeMealError("AI_QUOTA_EXCEEDED");
    }

    throw new AnalyzeMealError("RATE_LIMITED");
  }

  if (!response.ok) {
    throw new AnalyzeMealError("ANALYSIS_FAILED");
  }

  const data = (await response.json()) as MealAnalysis;
  return data;
}