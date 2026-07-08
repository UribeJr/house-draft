"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/labels";
import type { ActionState } from "@/lib/actions/auth";

export async function savePredictions(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const leagueId = String(formData.get("league_id") ?? "");
  const memberId = String(formData.get("league_member_id") ?? "");
  const winnerId = String(formData.get("predicted_winner_id") ?? "") || null;
  const firstBootId = String(formData.get("predicted_first_boot_id") ?? "") || null;

  const supabase = await createClient();
  const { error } = await supabase.from("predictions").upsert(
    {
      league_id: leagueId,
      league_member_id: memberId,
      predicted_winner_id: winnerId,
      predicted_first_boot_id: firstBootId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "league_member_id" }
  );

  if (error) return { error: friendlyError(error.message) };
  revalidatePath(`/leagues/${leagueId}/predictions`);
  return { message: "Predictions saved. The Diary Room has your receipts." };
}

export async function lockPredictions(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const leagueId = String(formData.get("league_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("lock_predictions", { p_league_id: leagueId });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath(`/leagues/${leagueId}`, "layout");
  return { message: "Predictions locked. No takebacks." };
}
