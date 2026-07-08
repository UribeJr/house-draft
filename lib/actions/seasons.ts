"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/labels";
import type { ActionState } from "@/lib/actions/auth";
import type { Database } from "@/lib/types/database";

type HouseguestStatus = Database["public"]["Enums"]["houseguest_status"];

export async function createSeason(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Season name needs at least 2 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { data, error } = await supabase
    .from("seasons")
    .insert({ name, created_by: user.id })
    .select("id")
    .single();

  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/seasons");
  redirect(`/seasons/${data.id}`);
}

async function uploadImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  seasonId: string,
  houseguestId: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${seasonId}/${houseguestId}.${ext}`;
  const { error } = await supabase.storage
    .from("houseguest-images")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (error) return { error: `Image upload failed: ${error.message}` };
  const { data } = supabase.storage.from("houseguest-images").getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function saveHouseguest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const seasonId = String(formData.get("season_id") ?? "");
  const houseguestId = String(formData.get("houseguest_id") ?? ""); // empty = create
  const name = String(formData.get("name") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const hometown = String(formData.get("hometown") ?? "").trim() || null;
  const occupation = String(formData.get("occupation") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "active") as HouseguestStatus;
  const placementRaw = String(formData.get("placement") ?? "").trim();
  const imageUrlInput = String(formData.get("image_url") ?? "").trim() || null;
  const imageFile = formData.get("image_file") as File | null;

  if (!name) return { error: "Houseguest name is required." };
  const age = ageRaw ? Number(ageRaw) : null;
  if (age !== null && (Number.isNaN(age) || age < 18 || age > 99))
    return { error: "Age must be between 18 and 99." };
  const placement = placementRaw ? Number(placementRaw) : null;

  const supabase = await createClient();

  let id = houseguestId;
  if (id) {
    const { error } = await supabase
      .from("houseguests")
      .update({ name, age, hometown, occupation, status, placement })
      .eq("id", id);
    if (error) return { error: friendlyError(error.message) };
  } else {
    const { data, error } = await supabase
      .from("houseguests")
      .insert({ season_id: seasonId, name, age, hometown, occupation, status, placement })
      .select("id")
      .single();
    if (error) return { error: friendlyError(error.message) };
    id = data.id;
  }

  // Image: uploaded file wins over pasted URL; either is optional.
  let imageUrl = imageUrlInput;
  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 4 * 1024 * 1024) return { error: "Image must be under 4 MB." };
    const uploaded = await uploadImage(supabase, seasonId, id, imageFile);
    if (uploaded.error) return { error: uploaded.error };
    imageUrl = uploaded.url ?? null;
  }
  if (imageUrl !== null) {
    const { error } = await supabase.from("houseguests").update({ image_url: imageUrl }).eq("id", id);
    if (error) return { error: friendlyError(error.message) };
  }

  revalidatePath(`/seasons/${seasonId}`);
  return { message: houseguestId ? "Houseguest updated." : `${name} moved into the house!` };
}

export async function deleteHouseguest(formData: FormData) {
  const id = String(formData.get("houseguest_id") ?? "");
  const seasonId = String(formData.get("season_id") ?? "");
  const supabase = await createClient();
  await supabase.from("houseguests").delete().eq("id", id);
  revalidatePath(`/seasons/${seasonId}`);
}
