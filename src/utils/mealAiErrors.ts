import type { TFunction } from "i18next";
import { AnalyzeMealError } from "@/utils/analyzeMeal";

export function getMealAiErrorMessage(error: unknown, t: TFunction) {
  if (!(error instanceof AnalyzeMealError)) {
    return {
      title: t("addMeal.analysisErrorTitle"),
      message: t("addMeal.analysisErrorMessage"),
    };
  }

  const errorMessages = {
    UNAUTHORIZED: ["unauthorizedTitle", "unauthorizedMessage"],
    IMAGE_TOO_LARGE: ["imageTooLargeTitle", "imageTooLargeMessage"],
    RATE_LIMITED: ["rateLimitedTitle", "rateLimitedMessage"],
    AI_QUOTA_EXCEEDED: ["aiQuotaTitle", "aiQuotaMessage"],
    API_NOT_CONFIGURED: ["apiNotConfiguredTitle", "apiNotConfiguredMessage"],
    AUTH_REQUIRED: ["authRequiredTitle", "authRequiredMessage"],
    ANALYSIS_FAILED: ["analysisErrorTitle", "analysisErrorMessage"],
  } as const;

  const [titleKey, messageKey] =
    errorMessages[error.code] ?? errorMessages.ANALYSIS_FAILED;

  return {
    title: t(`addMeal.${titleKey}`),
    message: t(`addMeal.${messageKey}`),
  };
}