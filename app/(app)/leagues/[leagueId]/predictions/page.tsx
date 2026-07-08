import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PredictionsForm } from "./PredictionsForm";

export default async function PredictionsPage({
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
    .select("id, season_id, predictions_locked_at, commissioner_id")
    .eq("id", leagueId)
    .single();
  if (!league) notFound();

  const locked = league.predictions_locked_at !== null;

  const [{ data: myMember }, { data: houseguests }, { data: allPredictions }] =
    await Promise.all([
      supabase
        .from("league_members")
        .select("id, team_name")
        .eq("league_id", leagueId)
        .eq("user_id", user!.id)
        .single(),
      supabase
        .from("houseguests")
        .select("id, name, image_url, status")
        .eq("season_id", league.season_id)
        .order("name"),
      // Before lock RLS returns only your own row; after lock, everyone's.
      supabase
        .from("predictions")
        .select(
          "league_member_id, member:league_members(team_name), winner:houseguests!predictions_predicted_winner_id_fkey(name, image_url), first_boot:houseguests!predictions_predicted_first_boot_id_fkey(name, image_url)"
        )
        .eq("league_id", leagueId),
    ]);

  const mine = (allPredictions ?? []).find((p) => p.league_member_id === myMember?.id);

  return (
    <PredictionsForm
      leagueId={leagueId}
      memberId={myMember?.id ?? null}
      houseguests={houseguests ?? []}
      locked={locked}
      isCommissioner={league.commissioner_id === user!.id}
      myWinnerName={mine?.winner?.name ?? null}
      myFirstBootName={mine?.first_boot?.name ?? null}
      leaguePredictions={
        locked
          ? (allPredictions ?? []).map((p) => ({
              team: p.member?.team_name ?? "?",
              winner: p.winner?.name ?? "—",
              winnerImg: p.winner?.image_url ?? null,
              firstBoot: p.first_boot?.name ?? "—",
              firstBootImg: p.first_boot?.image_url ?? null,
            }))
          : []
      }
    />
  );
}
