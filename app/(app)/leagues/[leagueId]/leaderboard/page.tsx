import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HgAvatar } from "@/components/HgAvatar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { EVENT_LABELS } from "@/lib/labels";
import { EventIcon, TrophyIcon, CrownIcon } from "@/components/icons";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: leaderboard }, { data: weekly }, { data: events }, { data: myMember }, { data: league }] =
    await Promise.all([
      supabase.from("league_leaderboard").select("*").eq("league_id", leagueId).order("rank"),
      supabase.from("weekly_scores").select("*").eq("league_id", leagueId),
      supabase
        .from("scoring_events")
        .select(
          "id, event_type, points, week, episode, notes, created_at, houseguest:houseguests(name, image_url), member:league_members(team_name)"
        )
        .eq("league_id", leagueId)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("league_members")
        .select("id")
        .eq("league_id", leagueId)
        .eq("user_id", user!.id)
        .single(),
      supabase.from("leagues").select("status").eq("id", leagueId).single(),
    ]);

  if (!leaderboard) notFound();

  const weeks = [...new Set((weekly ?? []).map((w) => w.week))].sort((a, b) => (a ?? 0) - (b ?? 0));
  const currentWeek = weeks.length > 0 ? weeks[weeks.length - 1] : null;
  const weeklyByMember = new Map<string, Map<number, number>>();
  for (const w of weekly ?? []) {
    if (!w.league_member_id || w.week === null || w.points === null) continue;
    if (!weeklyByMember.has(w.league_member_id)) weeklyByMember.set(w.league_member_id, new Map());
    weeklyByMember.get(w.league_member_id)!.set(w.week, w.points);
  }

  const champion = league?.status === "completed" ? leaderboard[0] : null;

  return (
    <div className="space-y-6">
      {champion && (
        <Card className="text-center">
          <CardHeader band="yellow">Your league champion</CardHeader>
          <CardContent className="p-8">
            <TrophyIcon className="mx-auto h-12 w-12" />
            <h2 className="type-instruction-heading-medium mt-2">{champion.team_name}</h2>
            <p className="mt-1 text-zinc-700">
              @{champion.username} · {champion.total_points} points
            </p>
            <p className="mt-3 text-sm text-zinc-600">
              They drafted the house, survived the block, and won eviction night. GG.
            </p>
            <p className="mono-footer mt-6">House Draft</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader band="green">Standings</CardHeader>
        <CardContent className="overflow-x-auto">
        {leaderboard.length === 0 ? (
          <p className="text-sm text-zinc-500">No teams yet.</p>
        ) : (
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="type-card-large text-left text-zinc-500">
                <th className="pb-2 pr-2">#</th>
                <th className="pb-2 pr-2">Team</th>
                {weeks.map((w) => (
                  <th key={w} className="pb-2 pr-2 text-right font-mono">
                    W{w}
                  </th>
                ))}
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => (
                <tr
                  key={row.league_member_id}
                  className={`border-t border-black/10 ${
                    row.league_member_id === myMember?.id ? "bg-[#fef200]/30" : ""
                  }`}
                >
                  <td className="type-card-large-bold py-2.5 pr-2 text-zinc-500">
                    {row.rank === 1 ? <CrownIcon className="h-4 w-4" /> : row.rank}
                  </td>
                  <td className="py-2.5 pr-2">
                    <span className="font-semibold">{row.team_name}</span>
                    <span className="ml-2 hidden text-xs text-zinc-500 sm:inline">
                      @{row.username}
                    </span>
                  </td>
                  {weeks.map((w) => {
                    const pts = row.league_member_id
                      ? weeklyByMember.get(row.league_member_id)?.get(w!) ?? 0
                      : 0;
                    const highlight = w === currentWeek && pts !== 0;
                    return (
                      <td
                        key={w}
                        className={`py-2.5 pr-2 text-right font-mono ${
                          highlight ? "font-bold text-[#f7941d]" : "text-zinc-600"
                        }`}
                      >
                        {pts !== 0 ? pts : "·"}
                      </td>
                    );
                  })}
                  <td className="type-instruction-body-large py-2.5 text-right text-[#f7941d]">
                    {row.total_points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </CardContent>
      </Card>

      {/* Event log */}
      <Card>
        <CardHeader band="pink">Diary Room Receipts</CardHeader>
        <CardContent>
        {!events || events.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No events yet. Once the commissioner starts scoring, every point lands here.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-xl surface-row px-3.5 py-2.5 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  {e.houseguest ? (
                    <HgAvatar name={e.houseguest.name} imageUrl={e.houseguest.image_url} size="sm" />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white">
                      <EventIcon type={e.event_type} className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate">
                      <span className="font-semibold">
                        {e.houseguest?.name ?? e.member?.team_name}
                      </span>{" "}
                      <span className="inline-flex items-center gap-1 text-zinc-600">
                        <EventIcon type={e.event_type} className="h-3.5 w-3.5" /> {EVENT_LABELS[e.event_type]}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Week {e.week}
                      {e.episode ? ` · Ep ${e.episode}` : ""}
                      {e.notes ? ` · “${e.notes}”` : ""}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 font-mono font-bold ${
                    e.points >= 0 ? "text-[#1fb25a]" : "text-[#f01c25]"
                  }`}
                >
                  {e.points > 0 ? `+${e.points}` : e.points}
                </span>
              </li>
            ))}
          </ul>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
