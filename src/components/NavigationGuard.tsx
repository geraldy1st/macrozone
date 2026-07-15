import { useAuth } from "@/contexts/AuthContext";
import { getOnboardingState } from "@/storage/onboarding";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

const AUTH_FLOW_ROUTES = new Set([
  "login",
  "signup",
  "auth",
  "verify-email",
  "forgot-password",
  "reset-password",
  "profile-edit",
]);

export default function NavigationGuard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const segmentKey = segments.join("/");

  useEffect(() => {
    if (isLoading) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const onboarding = await getOnboardingState(Boolean(user));

      if (cancelled) {
        return;
      }

      const root = segments[0];
      const onWelcome = root === "welcome";
      const onAuthFlow = AUTH_FLOW_ROUTES.has(root ?? "");
      const needsWelcome = onboarding === "pending";

      if (needsWelcome && !onWelcome && !onAuthFlow) {
        router.replace("/welcome");
        return;
      }

      if (!needsWelcome && onWelcome) {
        router.replace("/(tabs)");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, router, segmentKey, segments, user]);

  return null;
}