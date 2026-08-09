import { supabase } from "../supabase";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  onboarded: boolean;
  farm_name: string | null;
  farm_location: string | null;
  farm_type: string | null;
  farm_size: number | null;
  farm_size_unit: string | null;
  irrigation_method: string | null;
  storage_facilities: string[];
  phone: string | null;
  address: string | null;
  preferred_contact: string | null;
  language: string | null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("getProfile error", error.message);
    return null;
  }
  return (data as Profile) ?? null;
}

export async function ensureProfile(
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null,
): Promise<Profile | null> {
  if (!user) return null;

  const existing = await getProfile(user.id);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      full_name:
        (user.user_metadata?.full_name as string) ??
        (user.user_metadata?.name as string) ??
        null,
      avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
      onboarded: false,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("ensureProfile error", error.message);
    return null;
  }
  return (data as Profile) ?? null;
}

export async function saveProfile(
  userId: string,
  fields: Partial<Profile>,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...fields, onboarded: true })
    .eq("id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("saveProfile error", error.message);
    return null;
  }
  return (data as Profile) ?? null;
}

export async function setFarmCrops(
  userId: string,
  crops: string[],
): Promise<boolean> {
  const { error: delErr } = await supabase
    .from("farm_crops")
    .delete()
    .eq("profile_id", userId);
  if (delErr) {
    console.error("setFarmCrops delete error", delErr.message);
    return false;
  }

  if (crops.length === 0) return true;

  const { error: insErr } = await supabase
    .from("farm_crops")
    .insert(crops.map((crop) => ({ profile_id: userId, crop })));
  if (insErr) {
    console.error("setFarmCrops insert error", insErr.message);
    return false;
  }
  return true;
}

export async function getFarmCrops(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("farm_crops")
    .select("crop")
    .eq("profile_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getFarmCrops error", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.crop as string);
}
