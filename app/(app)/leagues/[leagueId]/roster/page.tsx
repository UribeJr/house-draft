import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HgAvatar } from "@/components/HgAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/labels";
import { CrystalBallIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";

export default async function RosterPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myMember } = await supabase
    .from("league_members")
    .select("id, team_name")
    .eq("league_id", leagueId)
    .eq("user_id", user!.id)
    .single();

  if (!myMember) {
    return <p className="text-sm text-zinc-600">You&apos;re not a member of this league.</p>;
  }

  const [{ data: roster }, { data: myEvents }] = await Promise.all([
    supabase
      .from("rosters")
      .select(
        "id, acquired_at, acquisition_type, houseguest:houseguests(id, name, image_url, age, hometown, occupation, status, placement)"
      )
      .eq("league_member_id", myMember.id)
      .is("released_at", null)
      .order("acquired_at"),
    supabase
      .from("member_scoring_events")
      .select("houseguest_id, points")
      .eq("league_id", leagueId)
      .eq("attributed_member_id", myMember.id),
  ]);

  const pointsByHg = new Map<string, number>();
  let bonusPoints = 0;
  let totalPoints = 0;
  for (const e of myEvents ?? []) {
    totalPoints += e.points ?? 0;
    if (e.houseguest_id) {
      pointsByHg.set(e.houseguest_id, (pointsByHg.get(e.houseguest_id) ?? 0) + (e.points ?? 0));
    } else {
      bonusPoints += e.points ?? 0;
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h2 className="type-board-large">{myMember.team_name}</h2>
            <p className="text-sm text-zinc-600">
              {roster?.length ?? 0} houseguest{(roster?.length ?? 0) === 1 ? "" : "s"} on the roster
            </p>
          </div>
          <div className="text-right">
            <p className="type-instruction-heading-medium text-[#f7941d]">{totalPoints}</p>
            <p className="type-card-large text-zinc-500">total points</p>
          </div>
        </CardContent>
      </Card>

      {!roster || roster.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <Mascot size="md" />
            <h2 className="type-board-large mt-4">Empty roster</h2>
            <p className="mt-1 max-w-sm text-sm text-zinc-600">
              Your team fills up on draft night. Until then, this chair stays empty.
            </p>
            <Link href={`/leagues/${leagueId}/draft`} className="btn-secondary mt-6">
              Go to the draft room
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {roster.map((r) => {
            const hg = r.houseguest!;
            const pts = pointsByHg.get(hg.id) ?? 0;
            return (
              <div key={r.id} className="card flex items-center gap-4 p-4">
                <HgAvatar name={hg.name} imageUrl={hg.image_url} size="lg" dimmed={hg.status === "evicted"} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold">{hg.name}</h3>
                  <p className="truncate text-xs text-zinc-600">
                    {[hg.age, hg.hometown, hg.occupation].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge variant={STATUS_STYLES[hg.status]}>{STATUS_LABELS[hg.status]}</Badge>
                    {r.acquisition_type === "trade" && (
                      <span className="type-card-medium-caps text-[#9747ff]">via trade</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`type-instruction-body-large ${pts >= 0 ? "text-[#1fb25a]" : "text-[#f01c25]"}`}
                  >
                    {pts > 0 ? `+${pts}` : pts}
                  </p>
                  <p className="type-card-large text-zinc-500">pts</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {bonusPoints !== 0 && (
        <Card>
          <CardContent className="flex items-center justify-between p-4 text-sm">
            <span className="flex items-center gap-2">
              <CrystalBallIcon className="h-4 w-4" /> Prediction bonuses (yours, not your houseguests&apos;)
            </span>
            <span className="font-mono font-bold text-[#1fb25a]">+{bonusPoints}</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
