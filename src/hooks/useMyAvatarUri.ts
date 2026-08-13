import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile } from "@/storage/profile";
import { resolveDisplayAvatarUri } from "@/utils/avatar";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/**
 * Local in-app profile photo (never Google).
 * Used so Community / Member profile show the same image as the Profile tab.
 */
export function useMyAvatarUri() {
  const { user } = useAuth();
  const [uri, setUri] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setUri(null);
      return;
    }
    try {
      const local = await getUserProfile();
      setUri(resolveDisplayAvatarUri(local.photoUri));
    } catch {
      setUri(null);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { myAvatarUri: uri, reloadMyAvatar: reload };
}
