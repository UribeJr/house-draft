"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { updateLeagueSettings } from "@/lib/actions/leagues";
import { startDraft } from "@/lib/actions/draft";
import {
  addScoringEvent,
  deleteScoringEvent,
  updateHouseguestStatus,
  awardFinaleBonuses,
} from "@/lib/actions/scoring";
import { lockPredictions } from "@/lib/actions/predictions";
import { FormNotice } from "@/components/FormNotice";
import { useActionToast } from "@/lib/useActionToast";
import { HgAvatar } from "@/components/HgAvatar";
import { SubmitButton } from "@/components/SubmitButton";
import { EntityCombobox } from "@/components/EntityCombobox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EVENT_LABELS,
  MEMBER_EVENT_TYPES,
  STATUS_LABELS,
  type EventType,
  type HouseguestStatus,
} from "@/lib/labels";
import type { Tables } from "@/lib/types/database";
import {
  GaugeIcon,
  DiceIcon,
  CheckTokenIcon,
  CrystalBallIcon,
  LockIcon,
  DoorExitIcon,
  TrophyIcon,
  ClapperboardIcon,
  ReceiptIcon,
} from "@/components/icons";

type Member = {
  id: string;
  team_name: string;
  draft_position: number | null;
  profile: { username: string } | null;
};
type Hg = {
  id: string;
  name: string;
  status: HouseguestStatus;
  placement: number | null;
  image_url: string | null;
};
type Rule = { event_type: EventType; points: number };
type RecentEvent = {
  id: string;
  event_type: EventType;
  points: number;
  week: number;
  episode: number | null;
  houseguest: { name: string; image_url: string | null } | null;
  member: { team_name: string } | null;
};

function Section({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent>
        <h2 className="flex items-center gap-2 font-bold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
        <div className="mt-4">{children}</div>
      </CardContent>
    </Card>
  );
}

function DraftOrderPicker({ members, leagueId }: { members: Member[]; leagueId: string }) {
  const [order, setOrder] = useState(members.map((m) => m.id));
  const [state, action] = useActionState(startDraft, null);
  useActionToast(state);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setOrder(next);
  };

  const byId = new Map(members.map((m) => [m.id, m]));

  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {order.map((id, idx) => {
          const m = byId.get(id)!;
          return (
            <li
              key={id}
              className="flex items-center justify-between rounded-xl surface-row px-3 py-2 text-sm"
            >
              <span>
                <span className="type-card-large-bold mr-2 text-zinc-500">{idx + 1}.</span>
                <span className="font-semibold">{m.team_name}</span>
                <span className="ml-2 text-xs text-zinc-500">@{m.profile?.username}</span>
              </span>
              <span className="flex gap-1">
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="btn-secondary type-board-small !px-2 !py-1 disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === order.length - 1} className="btn-secondary type-board-small !px-2 !py-1 disabled:opacity-30">↓</button>
              </span>
            </li>
          );
        })}
      </ol>
      <FormNotice state={state} />
      <div className="flex flex-wrap gap-2">
        <form action={action}>
          <input type="hidden" name="league_id" value={leagueId} />
          <input type="hidden" name="member_order" value={order.join(",")} />
          <SubmitButton pendingLabel="Starting…">
            <DiceIcon className="h-4 w-4" /> Start draft with this order
          </SubmitButton>
        </form>
        <form action={action}>
          <input type="hidden" name="league_id" value={leagueId} />
          {/* no member_order -> server randomizes */}
          <SubmitButton pendingLabel="Shuffling…" variant="secondary">
            <DiceIcon className="h-4 w-4" /> Randomize &amp; start
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}

export function CommissionerRoom({
  league,
  draft,
  members,
  houseguests,
  rules,
  recentEvents,
}: {
  league: Tables<"leagues"> & { season: { id: string; name: string; created_by: string | null } | null };
  draft: Tables<"drafts"> | null;
  members: Member[];
  houseguests: Hg[];
  rules: Rule[];
  recentEvents: RecentEvent[];
}) {
  const [settingsState, settingsAction] = useActionState(updateLeagueSettings, null);
  const [scoreState, scoreAction] = useActionState(addScoringEvent, null);
  const [statusState, statusAction] = useActionState(updateHouseguestStatus, null);
  const [finaleState, finaleAction] = useActionState(awardFinaleBonuses, null);
  const [lockState, lockAction] = useActionState(lockPredictions, null);
  useActionToast(settingsState);
  useActionToast(scoreState);
  useActionToast(statusState);
  useActionToast(finaleState);
  useActionToast(lockState);

  const [eventType, setEventType] = useState<EventType>("HOH_WIN");
  const pointsFor = (et: EventType) => rules.find((r) => r.event_type === et)?.points ?? 0;
  const isMemberEvent = MEMBER_EVENT_TYPES.includes(eventType);

  return (
    <div className="space-y-6">
      <Card className="border-[#9747ff]/30 bg-[#9747ff]/5">
        <CardContent className="p-4">
          <h2 className="flex items-center gap-2 font-bold text-[#9747ff]">
            <GaugeIcon className="h-5 w-5" /> Commissioner Room
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Only you can see this page. With great power comes great pettiness.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Draft controls */}
          <Section
            title={<><DiceIcon className="h-4 w-4" /> Draft Controls</>}
            subtitle={
              draft?.status === "pending"
                ? `${members.length} teams · ${league.roster_size} rounds · needs ${members.length * league.roster_size} of ${houseguests.length} houseguests`
                : undefined
            }
          >
            {draft?.status === "pending" ? (
              members.length >= 2 ? (
                <DraftOrderPicker members={members} leagueId={league.id} />
              ) : (
                <p className="text-sm text-zinc-600">
                  You need at least 2 teams. Share the invite code{" "}
                  <span className="font-mono font-bold text-[#fef200]">{league.invite_code}</span>{" "}
                  to fill the house.
                </p>
              )
            ) : draft?.status === "active" ? (
              <p className="text-sm">
                Draft is live — pick {draft.current_pick} of {draft.total_picks}.{" "}
                <Link href={`/leagues/${league.id}/draft`} className="font-semibold text-[#f7941d] hover:underline">
                  Go to the draft room →
                </Link>
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-sm text-[#1fb25a]">
                <CheckTokenIcon className="h-4 w-4" /> Draft complete.
              </p>
            )}
          </Section>

          {/* Predictions lock */}
          <Section title={<><CrystalBallIcon className="h-4 w-4" /> Predictions</>}>
            {league.predictions_locked_at ? (
              <p className="text-sm text-zinc-600">Locked. Everyone&apos;s picks are public.</p>
            ) : (
              <form action={lockAction} className="flex items-center justify-between gap-3">
                <input type="hidden" name="league_id" value={league.id} />
                <p className="text-sm text-zinc-600">Open — members can still change their picks.</p>
                <SubmitButton pendingLabel="Locking…" variant="secondary">
                  <LockIcon className="h-4 w-4" /> Lock now
                </SubmitButton>
              </form>
            )}
            <FormNotice state={lockState} />
          </Section>

          {/* Cast status */}
          <Section
            title={<><DoorExitIcon className="h-4 w-4" /> Cast Status</>}
            subtitle="Mark evictions, jury, finalists, and the winner. Placement: 1 = winner, highest number = first boot."
          >
            <form action={statusAction} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input type="hidden" name="league_id" value={league.id} />
              <div className="sm:col-span-2">
                <EntityCombobox
                  name="houseguest_id"
                  required
                  items={houseguests.map((h) => ({
                    id: h.id,
                    name: h.name,
                    imageUrl: h.image_url,
                    status: h.status,
                    secondary: h.placement ? `#${h.placement}` : null,
                  }))}
                  placeholder="Houseguest…"
                  searchPlaceholder="Search cast…"
                />
              </div>
              <Select name="status" defaultValue="evicted">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["active", "evicted", "jury", "finalist", "winner"] as const).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input name="placement" type="number" min={1} className="input" placeholder="Place #" />
              <div className="sm:col-span-4">
                <SubmitButton pendingLabel="Updating…" variant="secondary" className="w-full">
                  Update status
                </SubmitButton>
              </div>
            </form>
            <FormNotice state={statusState} />
            {league.season?.created_by && (
              <p className="mt-2 text-xs text-zinc-500">
                Full cast editing (bios, photos) lives in the{" "}
                <Link href={`/seasons/${league.season_id}`} className="text-[#f7941d] hover:underline">
                  season manager
                </Link>
                .
              </p>
            )}
          </Section>

          {/* Finale */}
          <Section
            title={<><TrophyIcon className="h-4 w-4" /> Finale Night</>}
            subtitle="When the season ends: 1) mark the winner + placements above, 2) add finale events (WINNER, RUNNER_UP…), 3) award prediction bonuses and close the league."
          >
            <form action={finaleAction}>
              <input type="hidden" name="league_id" value={league.id} />
              <SubmitButton
                pendingLabel="Rolling credits…"
                variant={league.status === "completed" ? "secondary" : "primary"}
                className="w-full"
              >
                {league.status === "completed" ? (
                  "Re-run prediction bonuses (idempotent)"
                ) : (
                  <>
                    <ClapperboardIcon className="h-4 w-4" /> Award prediction bonuses &amp; crown the champion
                  </>
                )}
              </SubmitButton>
            </form>
            <FormNotice state={finaleState} />
          </Section>
        </div>

        <div className="space-y-6">
          {/* Scoring entry */}
          <Section
            title={<><ReceiptIcon className="h-4 w-4" /> Score an Event</>}
            subtitle="Points auto-fill from your league's scoring rules."
          >
            <form action={scoreAction} className="space-y-3">
              <input type="hidden" name="league_id" value={league.id} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Week</label>
                  <input name="week" type="number" min={0} defaultValue={1} required className="input" />
                </div>
                <div>
                  <label className="label">Episode (optional)</label>
                  <input name="episode" type="number" min={1} className="input" placeholder="—" />
                </div>
              </div>
              <div>
                <label className="label">Event</label>
                <Select
                  name="event_type"
                  value={eventType}
                  onValueChange={(v) => setEventType(v as EventType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rules.map((r) => (
                      <SelectItem key={r.event_type} value={r.event_type}>
                        {EVENT_LABELS[r.event_type]} ({r.points > 0 ? "+" : ""}{r.points})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="label">{isMemberEvent ? "Team (prediction bonus)" : "Houseguest"}</label>
                {isMemberEvent ? (
                  <EntityCombobox
                    key="target-member"
                    name="target_id"
                    required
                    items={members.map((m) => ({ id: m.id, name: m.team_name }))}
                    placeholder="Pick a team…"
                    searchPlaceholder="Search teams…"
                  />
                ) : (
                  <EntityCombobox
                    key="target-houseguest"
                    name="target_id"
                    required
                    items={houseguests.map((h) => ({
                      id: h.id,
                      name: h.name,
                      imageUrl: h.image_url,
                      status: h.status,
                    }))}
                    placeholder="Pick a houseguest…"
                    searchPlaceholder="Search cast…"
                  />
                )}
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <input name="notes" className="input" placeholder="Backdoored at the veto meeting…" />
              </div>
              <div className="flex items-center justify-between rounded-xl surface-row px-3.5 py-2.5 text-sm">
                <span className="text-zinc-600">Points to award</span>
                <span className={`type-instruction-body-large ${pointsFor(eventType) >= 0 ? "text-[#1fb25a]" : "text-[#f01c25]"}`}>
                  {pointsFor(eventType) > 0 ? `+${pointsFor(eventType)}` : pointsFor(eventType)}
                </span>
              </div>
              <FormNotice state={scoreState} />
              <SubmitButton pendingLabel="Scoring…" className="w-full">
                Add to the record
              </SubmitButton>
            </form>
          </Section>

          {/* Recent events with undo */}
          <Section
            title={<><ReceiptIcon className="h-4 w-4" /> Recent Entries</>}
            subtitle="Fat-fingered something? Delete it — the leaderboard recalculates instantly."
          >
            {recentEvents.length === 0 ? (
              <p className="text-sm text-zinc-500">Nothing scored yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentEvents.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 rounded-xl surface-row px-3 py-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2 truncate">
                      {e.houseguest && (
                        <HgAvatar name={e.houseguest.name} imageUrl={e.houseguest.image_url} size="xs" />
                      )}
                      <span className="font-semibold">{e.houseguest?.name ?? e.member?.team_name}</span>{" "}
                      <span className="text-zinc-600">
                        · {EVENT_LABELS[e.event_type]} · Wk {e.week} ·{" "}
                        <span className={e.points >= 0 ? "text-[#1fb25a]" : "text-[#f01c25]"}>
                          {e.points > 0 ? `+${e.points}` : e.points}
                        </span>
                      </span>
                    </span>
                    <form action={deleteScoringEvent}>
                      <input type="hidden" name="event_id" value={e.id} />
                      <input type="hidden" name="league_id" value={league.id} />
                      <button type="submit" className="btn-danger !px-2 !py-1 text-xs">✕</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* League settings */}
          <Section title={<><GaugeIcon className="h-4 w-4" /> League Settings</>}>
            <form action={settingsAction} className="space-y-4">
              <input type="hidden" name="league_id" value={league.id} />
              <div>
                <label className="label">League name</label>
                <input name="name" defaultValue={league.name} required minLength={2} maxLength={60} className="input" />
              </div>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">Trades enabled</span>
                <input
                  type="checkbox"
                  name="trades_enabled"
                  defaultChecked={league.trades_enabled}
                  className="h-5 w-5 accent-[#f7941d]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">Commissioner approval for trades</span>
                <input
                  type="checkbox"
                  name="trade_approval_required"
                  defaultChecked={league.trade_approval_required}
                  className="h-5 w-5 accent-[#f7941d]"
                />
              </label>
              <FormNotice state={settingsState} />
              <SubmitButton pendingLabel="Saving…" variant="secondary" className="w-full">
                Save settings
              </SubmitButton>
            </form>
          </Section>
        </div>
      </div>
    </div>
  );
}
