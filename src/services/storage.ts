/**
 * Storage Service — Chow
 * Manages uploads to Supabase Storage buckets: `avatars`, `food-images`, `category-images`.
 */
import { isSupabaseConfigured, supabase } from './supabase';

export async function uploadAvatarImage(userId: string, file: Blob | ArrayBuffer, fileExt: string = 'jpg'): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const filePath = `${userId}/avatar.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) return null;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  } catch {
    return null;
  }
}
