import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "onboardingState";

export type OnboardingState = "pending" | "guest" | "authenticated";

export async function getOnboardingState(
  hasUser: boolean,
): Promise<OnboardingState> {
  if (hasUser) {
    return "authenticated";
  }

  const value = await AsyncStorage.getItem(ONBOARDING_KEY);

  if (value === "guest") {
    return "guest";
  }

  return "pending";
}

export async function setGuestOnboarding() {
  await AsyncStorage.setItem(ONBOARDING_KEY, "guest");
}

export async function setAuthenticatedOnboarding() {
  await AsyncStorage.setItem(ONBOARDING_KEY, "authenticated");
}

export async function resetOnboarding() {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}