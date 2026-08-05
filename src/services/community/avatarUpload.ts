import { supabase } from "@/lib/supabase";
import { MEAL_POSTS_BUCKET } from "@/types/community";
import { base64ToUint8Array } from "@/utils/base64";
import { prepareImageForUpload } from "@/utils/photos";

/**
 * Upload a local profile photo to public storage under {userId}/profile-avatar.jpg.
 * Reuses meal-posts bucket RLS (folder = auth.uid()).
 * Returns a cache-busted public URL.
 */
export async function uploadProfileAvatar(
  userId: string,
  localUri: string,
): Promise<string> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const prepared = await prepareImageForUpload(localUri);
  const bytes = base64ToUint8Array(prepared.base64);
  const path = `${userId}/profile-avatar.jpg`;

  const { error } = await supabase.storage.from(MEAL_POSTS_BUCKET).upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(MEAL_POSTS_BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl ?? "";
  if (!publicUrl) {
    throw new Error("AVATAR_URL_MISSING");
  }

  return `${publicUrl}?t=${Date.now()}`;
}
