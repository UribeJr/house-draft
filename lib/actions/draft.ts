"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/labels";
import type { ActionState } from "@/lib/actions/auth";

export async function startDraft(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const leagueId = String(formData.get("league_id") ?? "");
  const orderRaw = String(formData.get("member_order") ?? "").trim();
  const memberOrder = orderRaw ? orderRaw.split(",").filter(Boolean) : undefined;

  const supabase = await createClient();
  const { error } = await supabase.rpc("start_draft", {
    p_league_id: leagueId,
    ...(memberOrder ? { p_member_order: memberOrder } : {}),
  });

  if (error) return { error: friendlyError(error.message) };
  revalidatePath(`/leagues/${leagueId}`, "layout");
  return { message: "The draft is LIVE. Draft the house!" };
}

export async function makeDraftPick(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const leagueId = String(formData.get("league_id") ?? "");
  const houseguestId = String(formData.get("houseguest_id") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("make_draft_pick", {
    p_league_id: leagueId,
    p_houseguest_id: houseguestId,
  });

  if (error) return { error: friendlyError(error.message) };
  revalidatePath(`/leagues/${leagueId}`, "layout");
  const complete =
    typeof data === "object" && data !== null && "draft_complete" in data
      ? Boolean((data as { draft_complete?: boolean }).draft_complete)
      : false;
  return { message: complete ? "Draft complete! The season is live." : "Pick locked in." };
}
