import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DraftRoom } from "./DraftRoom";

export default async function DraftPage({
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
    .select("id, name, roster_size, season_id, commissioner_id, status")
    .eq("id", leagueId)
    .single();
  if (!league) notFound();

  const [{ data: draft }, { data: members }, { data: picks }, { data: houseguests }] =
    await Promise.all([
      supabase.from("drafts").select("*").eq("league_id", leagueId).single(),
      supabase
        .from("league_members")
        .select("id, team_name, draft_position, user_id, profile:profiles(username)")
        .eq("league_id", leagueId)
        .order("draft_position", { ascending: true, nullsFirst: false }),
      supabase
        .from("draft_picks")
        .select("pick_number, round, league_member_id, houseguest:houseguests(id, name, image_url)")
        .eq("league_id", leagueId)
        .order("pick_number"),
      supabase
        .from("houseguests")
        .select("id, name, image_url, age, hometown, occupation, status")
        .eq("season_id", league.season_id)
        .order("name"),
    ]);

  if (!draft) notFound();

  return (
    <DraftRoom
      league={league}
      draft={draft}
      members={members ?? []}
      picks={picks ?? []}
      houseguests={houseguests ?? []}
      currentUserId={user!.id}
    />
  );
}
