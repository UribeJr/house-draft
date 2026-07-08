import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TradesBoard } from "./TradesBoard";

export default async function TradesPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: league } = await supabase
    .from("leagues")
    .select("id, status, trades_enabled, trade_approval_required, commissioner_id")
    .eq("id", leagueId)
    .single();
  if (!league) notFound();

  const [{ data: myMember }, { data: rosterRows }, { data: trades }] = await Promise.all([
    supabase
      .from("league_members")
      .select("id, team_name")
      .eq("league_id", leagueId)
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("rosters")
      .select(
        "league_member_id, member:league_members(team_name), houseguest:houseguests(id, name, image_url, status)"
      )
      .eq("league_id", leagueId)
      .is("released_at", null),
    supabase
      .from("trades")
      .select(
        "id, status, created_at, resolved_at, proposer_member_id, recipient_member_id, proposer:league_members!trades_proposer_member_id_fkey(team_name, user_id), recipient:league_members!trades_recipient_member_id_fkey(team_name, user_id), items:trade_items(from_member_id, houseguest:houseguests(name, image_url))"
      )
      .eq("league_id", leagueId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <TradesBoard
      league={league}
      myMemberId={myMember?.id ?? null}
      currentUserId={user!.id}
      rosterRows={rosterRows ?? []}
      trades={trades ?? []}
    />
  );
}
