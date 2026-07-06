import { useAuth } from "@/contexts/AuthContext";
import {
  getOnboardingState,
  type OnboardingState,
} from "@/storage/onboarding";
import { useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";

export default function NavigationGuard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    getOnboardingState(Boolean(user)).then(setOnboarding);
  }, [user, isLoading]);

  useEffect(() => {
    if (isLoading || onboarding === null) {
      return;
    }

    const root = segments[0];
    const onWelcome = root === "welcome";
    const onAuthFlow =
      root === "login" || root === "auth" || root === "verify-email";
    const needsWelcome = onboarding === "pending";

    if (needsWelcome && !onWelcome && !onAuthFlow) {
      router.replace("/welcome");
      return;
    }

    if (!needsWelcome && onWelcome) {
      router.replace("/(tabs)");
    }
  }, [isLoading, onboarding, router, segments, user]);

  return null;
}