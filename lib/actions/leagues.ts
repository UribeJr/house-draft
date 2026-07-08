"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/labels";
import type { ActionState } from "@/lib/actions/auth";

export async function createLeague(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const seasonId = String(formData.get("season_id") ?? "");
  const rosterSize = Number(formData.get("roster_size") ?? 0);
  const teamName = String(formData.get("team_name") ?? "").trim();
  const tradesEnabled = formData.get("trades_enabled") === "on";
  const approvalRequired = formData.get("trade_approval_required") === "on";

  if (name.length < 2) return { error: "League name needs at least 2 characters." };
  if (!seasonId) return { error: "Pick a season for this league." };
  if (teamName.length < 2) return { error: "Team name needs at least 2 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_league", {
    p_name: name,
    p_season_id: seasonId,
    p_roster_size: rosterSize,
    p_trades_enabled: tradesEnabled,
    p_trade_approval_required: approvalRequired,
    p_team_name: teamName,
  });

  if (error) return { error: friendlyError(error.message) };
  const league = data?.[0];
  if (!league) return { error: "League creation failed. Try again." };

  revalidatePath("/dashboard");
  redirect(`/leagues/${league.league_id}`);
}

export async function joinLeague(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const code = String(formData.get("invite_code") ?? "").trim();
  const teamName = String(formData.get("team_name") ?? "").trim();

  if (!code) return { error: "Enter an invite code." };
  if (teamName.length < 2) return { error: "Team name needs at least 2 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_league_with_code", {
    p_invite_code: code,
    p_team_name: teamName,
  });

  if (error) return { error: friendlyError(error.message) };

  revalidatePath("/dashboard");
  redirect(`/leagues/${data}`);
}

export async function updateLeagueSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const leagueId = String(formData.get("league_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const tradesEnabled = formData.get("trades_enabled") === "on";
  const approvalRequired = formData.get("trade_approval_required") === "on";

  if (name.length < 2) return { error: "League name needs at least 2 characters." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("leagues")
    .update({
      name,
      trades_enabled: tradesEnabled,
      trade_approval_required: approvalRequired,
    })
    .eq("id", leagueId);

  if (error) return { error: friendlyError(error.message) };
  revalidatePath(`/leagues/${leagueId}`, "layout");
  return { message: "League settings saved." };
}
