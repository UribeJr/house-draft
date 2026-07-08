"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError, MEMBER_EVENT_TYPES, type EventType } from "@/lib/labels";
import type { ActionState } from "@/lib/actions/auth";
import type { Database } from "@/lib/types/database";

type HouseguestStatus = Database["public"]["Enums"]["houseguest_status"];

export async function addScoringEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const leagueId = String(formData.get("league_id") ?? "");
  const eventType = String(formData.get("event_type") ?? "") as EventType;
  const week = Number(formData.get("week") ?? 0);
  const episodeRaw = String(formData.get("episode") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  const targetId = String(formData.get("target_id") ?? "");

  if (!eventType) return { error: "Pick an event type." };
  if (!targetId) return { error: "Pick who this event applies to." };
  if (Number.isNaN(week) || week < 0) return { error: "Week must be 0 or higher." };

  const isMemberEvent = MEMBER_EVENT_TYPES.includes(eventType);

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_scoring_event", {
    p_league_id: leagueId,
    p_event_type: eventType,
    p_week: week,
    ...(isMemberEvent ? { p_league_member_id: targetId } : { p_houseguest_id: targetId }),
    ...(episodeRaw ? { p_episode: Number(episodeRaw) } : {}),
    ...(notes ? { p_notes: notes } : {}),
  });

  if (error) return { error: friendlyError(error.message) };
  revalidatePath(`/leagues/${leagueId}`, "layout");
  return { message: "Event scored. Leaderboard updated." };
}

export async function deleteScoringEvent(formData: FormData) {
  const id = String(formData.get("event_id") ?? "");
  const leagueId = String(formData.get("league_id") ?? "");
  const supabase = await createClient();
  await supabase.from("scoring_events").delete().eq("id", id);
  revalidatePath(`/leagues/${leagueId}`, "layout");
}

export async function updateHouseguestStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const leagueId = String(formData.get("league_id") ?? "");
  const houseguestId = String(formData.get("houseguest_id") ?? "");
  const status = String(formData.get("status") ?? "active") as HouseguestStatus;
  const placementRaw = String(formData.get("placement") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_houseguest_status", {
    p_houseguest_id: houseguestId,
    p_status: status,
    ...(placementRaw ? { p_placement: Number(placementRaw) } : {}),
  });

  if (error) return { error: friendlyError(error.message) };
  revalidatePath(`/leagues/${leagueId}`, "layout");
  return { message: "Houseguest status updated." };
}

export async function awardFinaleBonuses(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const leagueId = String(formData.get("league_id") ?? "");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("award_finale_bonuses", { p_league_id: leagueId });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath(`/leagues/${leagueId}`, "layout");
  return {
    message:
      data && data > 0
        ? `Finale complete! ${data} prediction bonus${data === 1 ? "" : "es"} awarded.`
        : "Finale complete! No prediction bonuses this time.",
  };
}
