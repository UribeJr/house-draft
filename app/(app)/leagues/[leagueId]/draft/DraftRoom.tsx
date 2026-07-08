"use client";

import Link from "next/link";
import { useActionState } from "react";
import { makeDraftPick } from "@/lib/actions/draft";
import { FormNotice } from "@/components/FormNotice";
import { SubmitButton } from "@/components/SubmitButton";
import { HgAvatar } from "@/components/HgAvatar";
import { Poller } from "@/components/Poller";
import { useActionToast } from "@/lib/useActionToast";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pickForCell, positionForPick, roundForPick } from "@/lib/draft";
import { DiceIcon, CheckTokenIcon } from "@/components/icons";

const PROPERTY_HEADER = [
  "prop-brown",
  "prop-blue-light",
  "prop-pink",
  "prop-orange",
  "prop-red",
  "prop-yellow",
  "prop-green",
  "prop-blue-dark",
] as const;

type Member = {
  id: string;
  team_name: string;
  draft_position: number | null;
  user_id: string;
  profile: { username: string } | null;
};
type Pick = {
  pick_number: number;
  round: number;
  league_member_id: string;
  houseguest: { id: string; name: string; image_url: string | null } | null;
};
type Houseguest = {
  id: string;
  name: string;
  image_url: string | null;
  age: number | null;
  hometown: string | null;
  occupation: string | null;
  status: string;
};
type Draft = {
  status: "pending" | "active" | "completed";
  current_pick: number;
  total_picks: number | null;
};
type League = {
  id: string;
  roster_size: number;
  commissioner_id: string;
};

export function DraftRoom({
  league,
  draft,
  members,
  picks,
  houseguests,
  currentUserId,
}: {
  league: League;
  draft: Draft;
  members: Member[];
  picks: Pick[];
  houseguests: Houseguest[];
  currentUserId: string;
}) {
  const [state, action] = useActionState(makeDraftPick, null);
  useActionToast(state);

  const teamCount = members.length;
  const ordered = [...members].sort(
    (a, b) => (a.draft_position ?? 99) - (b.draft_position ?? 99)
  );
  const pickByNumber = new Map(picks.map((p) => [p.pick_number, p]));
  const draftedIds = new Set(picks.map((p) => p.houseguest?.id));
  const available = houseguests.filter((hg) => !draftedIds.has(hg.id));

  const isCommissioner = league.commissioner_id === currentUserId;

  if (draft.status === "pending") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center px-6 py-16 text-center">
          <DiceIcon className="h-12 w-12" />
          <h2 className="mt-4 text-lg font-bold">Draft night hasn&apos;t started</h2>
          <p className="mt-1 max-w-md text-sm text-zinc-600">
            {teamCount} team{teamCount === 1 ? "" : "s"} in the league ·{" "}
            {league.roster_size} roster slots each · {houseguests.length} houseguests in
            the cast.
          </p>
          {isCommissioner ? (
            <Link href={`/leagues/${league.id}/commissioner`} className="btn-primary mt-6">
              Set the order &amp; start the draft
            </Link>
          ) : (
            <p className="mt-6 text-sm text-zinc-500">
              The commissioner will start the draft. Keep your snake takes ready.
            </p>
          )}
          <Poller intervalMs={5000} />
        </CardContent>
      </Card>
    );
  }

  const onClockPos =
    draft.status === "active" ? positionForPick(draft.current_pick, teamCount) : null;
  const onClockMember = onClockPos
    ? ordered.find((m) => m.draft_position === onClockPos)
    : null;
  const myTurn = onClockMember?.user_id === currentUserId;
  const totalRounds = league.roster_size;

  return (
    <div className="space-y-6">
      {draft.status === "active" && <Poller intervalMs={2500} />}

      {/* On the clock banner */}
      {draft.status === "active" && onClockMember && (
        <Card>
          <CardHeader band={myTurn ? "orange" : "blue-dark"}>
            {myTurn ? "You are on the clock" : `${onClockMember.team_name} is on the clock`}
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f01c25] opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[#f01c25]" />
              </span>
              <p className="font-bold">
                {myTurn ? "Draft your pick!" : "Waiting for their pick…"}
                <span className="ml-2 text-sm font-normal text-zinc-600">
                  Pick {draft.current_pick} of {draft.total_picks} · Round{" "}
                  {roundForPick(draft.current_pick, teamCount)}
                </span>
              </p>
            </div>
            {myTurn && (
              <Badge className="bg-[#fef200] text-black">Draft below</Badge>
            )}
          </CardContent>
        </Card>
      )}

      {draft.status === "completed" && (
        <Card>
          <CardHeader band="green">Draft complete</CardHeader>
          <p className="flex items-center justify-center gap-2 p-4 text-center font-bold text-[#0d6b32]">
            <CheckTokenIcon className="h-5 w-5" /> Every roster is full. Win eviction night!
          </p>
        </Card>
      )}

      <FormNotice state={state} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Draft board */}
        <Card className="xl:col-span-3">
          <CardHeader band="orange">Draft board</CardHeader>
          <CardContent className="overflow-x-auto p-4">
          <table className="w-full min-w-[560px] border-separate border-spacing-1.5">
            <thead>
              <tr>
                <th className="type-card-large w-10 text-zinc-600">Rd</th>
                {ordered.map((m, i) => (
                  <th key={m.id} className="px-1 pb-1 text-left">
                    <div
                      className={`type-card-medium-caps truncate rounded-t border-2 border-black px-1.5 py-1 ${PROPERTY_HEADER[i % PROPERTY_HEADER.length]}`}
                    >
                      {m.team_name}
                    </div>
                    <div className="truncate border-x-2 border-b-2 border-black bg-white px-1.5 py-0.5 text-[9px] text-zinc-600">
                      @{m.profile?.username}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalRounds }, (_, r) => r + 1).map((round) => (
                <tr key={round}>
                  <td className="text-center text-xs font-bold text-zinc-600">
                    {round}
                    <span className="block text-[9px] font-normal">
                      {round % 2 === 1 ? "→" : "←"}
                    </span>
                  </td>
                  {ordered.map((m) => {
                    const pickNum = pickForCell(round, m.draft_position ?? 0, teamCount);
                    const pick = pickByNumber.get(pickNum);
                    const isCurrent = draft.status === "active" && pickNum === draft.current_pick;
                    return (
                      <td
                        key={m.id}
                        className={`board-cell px-2 py-1.5 text-xs ${
                          isCurrent ? "board-cell-active" : ""
                        }`}
                      >
                        {pick ? (
                          <span className="flex items-center gap-1.5">
                            <HgAvatar
                              name={pick.houseguest?.name ?? "?"}
                              imageUrl={pick.houseguest?.image_url}
                              size="xs"
                            />
                            <span className="truncate font-semibold">{pick.houseguest?.name}</span>
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-zinc-600">
                            {isCurrent ? "picking…" : `#${pickNum}`}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mono-footer mt-3">Monopoly</p>
          </CardContent>
        </Card>

        {/* Available houseguests */}
        <Card className="xl:col-span-2">
          <CardHeader band="blue">
            Available · {available.length} left
          </CardHeader>
          <CardContent className="p-4">
          {available.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">The board is picked clean.</p>
          ) : (
            <ul className="mt-4 max-h-[480px] space-y-2 overflow-y-auto pr-1">
              {available.map((hg) => (
                <li
                  key={hg.id}
                  className="surface-row flex items-center gap-3 rounded-lg p-2.5"
                >
                  <HgAvatar name={hg.name} imageUrl={hg.image_url} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{hg.name}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {[hg.age, hg.hometown, hg.occupation].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  {draft.status === "active" && myTurn && (
                    <form action={action}>
                      <input type="hidden" name="league_id" value={league.id} />
                      <input type="hidden" name="houseguest_id" value={hg.id} />
                      <SubmitButton pendingLabel="…" className="!px-3 !py-1.5 !text-xs">
                        Draft
                      </SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
          </CardContent>
        </Card>
      </div>

      {/* Team rosters */}
      <Card>
        <CardHeader band="yellow">Team rosters</CardHeader>
        <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ordered.map((m, i) => {
            const teamPicks = picks.filter((p) => p.league_member_id === m.id);
            return (
              <div
                key={m.id}
                className="overflow-hidden rounded border-2 border-black bg-white shadow-[0_2px_0_rgba(0,0,0,0.15)]"
              >
                <div
                  className={`type-card-medium-caps border-b-2 border-black px-2 py-1 ${PROPERTY_HEADER[i % PROPERTY_HEADER.length]}`}
                >
                  {m.draft_position ? `${m.draft_position}. ` : ""}
                  {m.team_name}
                </div>
                <ul className="space-y-1.5 p-2">
                  {teamPicks.map((p) => (
                    <li key={p.pick_number} className="flex items-center gap-2 text-xs">
                      <HgAvatar name={p.houseguest?.name ?? "?"} imageUrl={p.houseguest?.image_url} size="sm" />
                      <span className="truncate">{p.houseguest?.name}</span>
                    </li>
                  ))}
                  {Array.from({ length: Math.max(0, league.roster_size - teamPicks.length) }).map((_, i) => (
                    <li key={`empty-${i}`} className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="h-8 w-8 shrink-0 rounded-full border-2 border-dashed border-black/25" />
                      Open slot
                    </li>
                  ))}
                </ul>
                <p className="mono-footer border-t border-black/10 py-1">Monopoly</p>
              </div>
            );
          })}
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
