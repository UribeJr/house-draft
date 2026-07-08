import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommissionerRoom } from "./CommissionerRoom";

export default async function CommissionerPage({
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
    .select("*, season:seasons(id, name, created_by)")
    .eq("id", leagueId)
    .single();
  if (!league) notFound();
  if (league.commissioner_id !== user!.id) redirect(`/leagues/${leagueId}`);

  const [{ data: draft }, { data: members }, { data: houseguests }, { data: rules }, { data: recentEvents }] =
    await Promise.all([
      supabase.from("drafts").select("*").eq("league_id", leagueId).single(),
      supabase
        .from("league_members")
        .select("id, team_name, draft_position, profile:profiles(username)")
        .eq("league_id", leagueId)
        .order("joined_at"),
      supabase
        .from("houseguests")
        .select("id, name, status, placement, image_url")
        .eq("season_id", league.season_id)
        .order("name"),
      supabase
        .from("scoring_rules")
        .select("event_type, points")
        .eq("league_id", leagueId),
      supabase
        .from("scoring_events")
        .select("id, event_type, points, week, episode, houseguest:houseguests(name, image_url), member:league_members(team_name)")
        .eq("league_id", leagueId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  return (
    <CommissionerRoom
      league={league}
      draft={draft}
      members={members ?? []}
      houseguests={houseguests ?? []}
      rules={rules ?? []}
      recentEvents={recentEvents ?? []}
    />
  );
}
