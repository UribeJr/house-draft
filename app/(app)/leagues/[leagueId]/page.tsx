import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CopyButton } from "@/components/CopyButton";
import { HgAvatar } from "@/components/HgAvatar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { EVENT_LABELS } from "@/lib/labels";
import {
  EventIcon,
  TrophyIcon,
  CrownIcon,
  DiceIcon,
  SwapArrowsIcon,
  CrystalBallIcon,
  GaugeIcon,
} from "@/components/icons";

export default async function LeagueHomePage({
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
    .select("*, season:seasons(id, name)")
    .eq("id", leagueId)
    .single();
  if (!league) notFound();

  const [
    { data: draft },
    { data: leaderboard },
    { data: myMember },
    { data: recentEvents },
    { data: pendingTrades },
  ] = await Promise.all([
    supabase.from("drafts").select("*").eq("league_id", leagueId).single(),
    supabase
      .from("league_leaderboard")
      .select("*")
      .eq("league_id", leagueId)
      .order("rank")
      .limit(4),
    supabase
      .from("league_members")
      .select("id, team_name")
      .eq("league_id", leagueId)
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("scoring_events")
      .select("id, event_type, points, week, notes, houseguest:houseguests(name, image_url), member:league_members(team_name)")
      .eq("league_id", leagueId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("trades")
      .select("id, status")
      .eq("league_id", leagueId)
      .in("status", ["pending", "accepted"]),
  ]);

  const { data: myRoster } = myMember
    ? await supabase
        .from("rosters")
        .select("id, houseguest:houseguests(id, name, image_url, status)")
        .eq("league_member_id", myMember.id)
        .is("released_at", null)
    : { data: [] };

  const isCommissioner = league.commissioner_id === user!.id;
  const champion = league.status === "completed" ? leaderboard?.[0] : null;

  const draftStatusCopy =
    draft?.status === "pending"
      ? "Waiting for the commissioner to start the draft."
      : draft?.status === "active"
        ? `Draft LIVE — pick ${draft.current_pick} of ${draft.total_picks}.`
        : "Draft complete. The season is on.";

  return (
    <div className="space-y-6">
      {champion && (
        <Link
          href={`/leagues/${leagueId}/leaderboard`}
          className="card block overflow-hidden p-0 transition hover:-translate-y-0.5"
        >
          <div className="card-band card-band-yellow">League Champion</div>
          <div className="p-6">
            <p className="type-instruction-heading-medium flex items-center gap-2">
              <TrophyIcon className="h-8 w-8" /> {champion.team_name}
            </p>
            <p className="mt-1 text-sm text-zinc-700">
              @{champion.username} · {champion.total_points} pts — see the full finale results →
            </p>
            <p className="mono-footer mt-4">Monopoly</p>
          </div>
        </Link>
      )}

      {draft?.status === "active" && (
        <Link
          href={`/leagues/${leagueId}/draft`}
          className="card block overflow-hidden p-0 transition hover:-translate-y-0.5"
        >
          <div className="card-band card-band-red animate-pulse">Draft LIVE</div>
          <p className="flex items-center justify-center gap-2 p-4 text-center font-bold text-[#f01c25]">
            <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-[#f01c25]" />
            Get to the draft room — you&apos;re on the clock
          </p>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Leaderboard preview */}
          <Card>
            <CardHeader band="green">Leaderboard</CardHeader>
            <CardContent>
            <div className="flex items-center justify-end">
              <Link href={`/leagues/${leagueId}/leaderboard`} className="text-xs font-semibold text-[#f7941d] hover:underline">
                Full standings →
              </Link>
            </div>
            {leaderboard && leaderboard.length > 0 ? (
              <ol className="mt-4 space-y-2">
                {leaderboard.map((row) => (
                  <li
                    key={row.league_member_id}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                      row.league_member_id === myMember?.id ? "bg-[#f7941d]/10" : "surface-row"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="type-card-large-bold flex w-6 items-center justify-center text-zinc-500">
                        {row.rank === 1 ? <CrownIcon className="h-4 w-4" /> : row.rank}
                      </span>
                      <span className="font-semibold">{row.team_name}</span>
                      <span className="hidden text-xs text-zinc-500 sm:inline">@{row.username}</span>
                    </span>
                    <span className="font-mono font-bold text-[#f7941d]">{row.total_points}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">No teams yet.</p>
            )}
            </CardContent>
          </Card>

          {/* Diary Room receipts */}
          <Card>
            <CardHeader band="pink">Diary Room Receipts</CardHeader>
            <CardContent>
            <div className="flex items-center justify-end">
              <Link href={`/leagues/${leagueId}/leaderboard`} className="text-xs font-semibold text-[#f7941d] hover:underline">
                All events →
              </Link>
            </div>
            {recentEvents && recentEvents.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {recentEvents.map((e) => (
                  <li key={e.id} className="flex items-center justify-between rounded-xl surface-row px-3 py-2.5 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      {e.houseguest ? (
                        <HgAvatar name={e.houseguest.name} imageUrl={e.houseguest.image_url} size="xs" />
                      ) : (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white">
                          <EventIcon type={e.event_type} className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span className="truncate">
                        <span className="font-semibold">{e.houseguest?.name ?? e.member?.team_name}</span>{" "}
                        <span className="text-zinc-600">· {EVENT_LABELS[e.event_type]} · Wk {e.week}</span>
                      </span>
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        e.points >= 0 ? "text-[#1fb25a]" : "text-[#f01c25]"
                      }`}
                    >
                      {e.points > 0 ? `+${e.points}` : e.points}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                Nothing scored yet. The Diary Room is quiet… too quiet.
              </p>
            )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Invite code */}
          <Card>
            <CardHeader band="orange">Invite friends</CardHeader>
            <CardContent>
            <p className="text-xs text-zinc-600">Share this code — they join with a team name.</p>
            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border-2 border-dashed border-black bg-[#fef200] px-4 py-3">
              <span className="type-board-large tracking-[0.3em] text-black">
                {league.invite_code}
              </span>
              <CopyButton text={league.invite_code} />
            </div>
            </CardContent>
          </Card>

          {/* My roster */}
          <Card>
            <CardHeader band="blue-dark">
              My Team{myMember ? ` · ${myMember.team_name}` : ""}
            </CardHeader>
            <CardContent>
            <div className="flex items-center justify-end">
              <Link href={`/leagues/${leagueId}/roster`} className="text-xs font-semibold text-[#f7941d] hover:underline">
                Details →
              </Link>
            </div>
            {myRoster && myRoster.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {myRoster.map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <HgAvatar name={r.houseguest!.name} imageUrl={r.houseguest!.image_url} size="sm" dimmed={r.houseguest!.status === "evicted"} />
                    <span className={`text-sm font-semibold ${r.houseguest!.status === "evicted" ? "text-zinc-500 line-through" : ""}`}>
                      {r.houseguest!.name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">{draftStatusCopy}</p>
            )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="text-sm">
            <CardHeader band="brown">House Status</CardHeader>
            <ul className="space-y-2.5 p-5 text-zinc-700">
              <li className="flex items-center gap-2">
                <DiceIcon className="h-4 w-4" /> {draftStatusCopy}
              </li>
              <li className="flex items-center gap-2">
                <SwapArrowsIcon className="h-4 w-4" />
                {league.trades_enabled
                  ? pendingTrades && pendingTrades.length > 0
                    ? `${pendingTrades.length} trade${pendingTrades.length === 1 ? "" : "s"} in motion.`
                    : "No trades in motion."
                  : "Trades disabled."}
              </li>
              <li className="flex items-center gap-2">
                <CrystalBallIcon className="h-4 w-4" />
                {league.predictions_locked_at
                  ? "Predictions are locked."
                  : "Predictions are open — call your shot."}
              </li>
            </ul>
          </Card>

          {isCommissioner && (
            <Card>
              <CardHeader band="blue" className="flex items-center gap-1.5">
                <GaugeIcon className="h-3.5 w-3.5" /> Commissioner Room
              </CardHeader>
              <CardContent>
              <p className="text-xs text-zinc-600">
                Run the draft, score episodes, rule on trades, and call the finale.
              </p>
              <Link href={`/leagues/${leagueId}/commissioner`} className="btn-secondary mt-3 w-full">
                Enter the Commissioner Room
              </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
