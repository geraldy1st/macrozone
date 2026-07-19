import { supabase } from "@/lib/supabase";
import type { CommunityProfile } from "@/types/community";

/**
 * Ensure a profiles row exists and is up to date for the signed-in user.
 * Call after login / before creating a post.
 */
export async function upsertMyProfile(input: {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
}): Promise<CommunityProfile> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const displayName =
    input.displayName.trim() ||
    "User";

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: input.userId,
        display_name: displayName.slice(0, 40),
        avatar_url: input.avatarUrl ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as CommunityProfile;
}

export async function getProfile(
  userId: string,
): Promise<CommunityProfile | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as CommunityProfile | null;
}
