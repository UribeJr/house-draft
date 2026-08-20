"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/labels";
import type { ActionState } from "@/lib/actions/auth";

export async function proposeTrade(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const leagueId = String(formData.get("league_id") ?? "");
  const myHouseguestId = String(formData.get("my_houseguest_id") ?? "");
  const theirHouseguestId = String(formData.get("their_houseguest_id") ?? "");

  if (!myHouseguestId || !theirHouseguestId)
    return { error: "Pick a houseguest from each side of the trade." };

  const supabase = await createClient();
  const { data: tradeId, error } = await supabase.rpc("propose_trade", {
    p_league_id: leagueId,
    p_my_houseguest_id: myHouseguestId,
    p_their_houseguest_id: theirHouseguestId,
  });

  if (error) return { error: friendlyError(error.message) };

  let message = "Trade proposed. Time to campaign.";
  if (tradeId) {
    const { data: trade } = await supabase
      .from("trades")
      .select("recipient_member_id")
      .eq("id", tradeId)
      .single();
    if (trade?.recipient_member_id === null) {
      message = "Claim submitted — awaiting the commissioner gavel.";
    }
  }

  revalidatePath(`/leagues/${leagueId}/trades`);
  return { message };
}

export async function respondToTrade(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const tradeId = String(formData.get("trade_id") ?? "");
  const leagueId = String(formData.get("league_id") ?? "");
  const accept = String(formData.get("decision") ?? "") === "accept";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("respond_to_trade", {
    p_trade_id: tradeId,
    p_accept: accept,
  });

  if (error) return { error: friendlyError(error.message) };
  revalidatePath(`/leagues/${leagueId}`, "layout");
  if (data === "accepted") {
    return { message: "Trade accepted." };
  }
  return { message: "Trade rejected." };
}

export async function approveTrade(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const tradeId = String(formData.get("trade_id") ?? "");
  const leagueId = String(formData.get("league_id") ?? "");
  const approve = String(formData.get("decision") ?? "") === "approve";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("approve_trade", {
    p_trade_id: tradeId,
    p_approve: approve,
  });

  if (error) return { error: friendlyError(error.message) };
  revalidatePath(`/leagues/${leagueId}`, "layout");
  return { message: data === "approved" ? "Backdoor complete — trade executed." : "Trade vetoed." };
}
