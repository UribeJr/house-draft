"use client";

import { useActionState } from "react";
import { proposeTrade, respondToTrade, approveTrade } from "@/lib/actions/trades";
import { FormNotice } from "@/components/FormNotice";
import { HgAvatar } from "@/components/HgAvatar";
import { SubmitButton } from "@/components/SubmitButton";
import { EntityCombobox } from "@/components/EntityCombobox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TRADE_STATUS_LABELS,
  TRADE_STATUS_STYLES,
  type TradeStatus,
  type HouseguestStatus,
} from "@/lib/labels";
import { GavelIcon, CheckTokenIcon, XTokenIcon, ShieldIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { useActionToast } from "@/lib/useActionToast";

type RosterRow = {
  league_member_id: string;
  member: { team_name: string } | null;
  houseguest: { id: string; name: string; image_url: string | null; status: HouseguestStatus } | null;
};
type LeftoverHouseguest = {
  id: string;
  name: string;
  image_url: string | null;
  status: HouseguestStatus;
};
type Trade = {
  id: string;
  status: TradeStatus;
  created_at: string;
  resolved_at: string | null;
  proposer_member_id: string;
  recipient_member_id: string | null;
  proposer: { team_name: string; user_id: string } | null;
  recipient: { team_name: string; user_id: string } | null;
  items: {
    from_member_id: string | null;
    houseguest: { name: string; image_url: string | null } | null;
  }[];
};
type League = {
  id: string;
  status: string;
  trades_enabled: boolean;
  trade_approval_required: boolean;
  commissioner_id: string;
};

export function TradesBoard({
  league,
  myMemberId,
  currentUserId,
  rosterRows,
  leftoverHouseguests,
  trades,
}: {
  league: League;
  myMemberId: string | null;
  currentUserId: string;
  rosterRows: RosterRow[];
  leftoverHouseguests: LeftoverHouseguest[];
  trades: Trade[];
}) {
  const [proposeState, proposeAction] = useActionState(proposeTrade, null);
  const [respondState, respondAction] = useActionState(respondToTrade, null);
  const [approveState, approveAction] = useActionState(approveTrade, null);
  useActionToast(proposeState);
  useActionToast(respondState);
  useActionToast(approveState);

  const myHouseguests = rosterRows.filter((r) => r.league_member_id === myMemberId);
  const theirHouseguests = rosterRows.filter((r) => r.league_member_id !== myMemberId);
  const isCommissioner = league.commissioner_id === currentUserId;
  const receiveOptions = [
    ...theirHouseguests.map((r) => ({
      id: r.houseguest!.id,
      name: r.houseguest!.name,
      imageUrl: r.houseguest!.image_url,
      status: r.houseguest!.status,
      secondary: r.member?.team_name ?? null,
    })),
    ...leftoverHouseguests.map((hg) => ({
      id: hg.id,
      name: hg.name,
      imageUrl: hg.image_url,
      status: hg.status,
      secondary: "Unclaimed",
    })),
  ];

  if (!league.trades_enabled) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center px-6 py-16 text-center">
          <Mascot size="md" />
          <h2 className="mt-4 text-lg font-bold">Trades are disabled</h2>
          <p className="mt-1 max-w-sm text-sm text-zinc-600">
            The commissioner turned trades off for this league. What happens in the
            house stays in the house.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Propose */}
      {league.status === "active" && myMemberId && (
        <form action={proposeAction} className="card space-y-4 p-5">
          <input type="hidden" name="league_id" value={league.id} />
          <h2 className="font-bold">Propose a Trade (1-for-1)</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="my_houseguest_id" className="label">You send</label>
              <EntityCombobox
                name="my_houseguest_id"
                required
                items={myHouseguests.map((r) => ({
                  id: r.houseguest!.id,
                  name: r.houseguest!.name,
                  imageUrl: r.houseguest!.image_url,
                  status: r.houseguest!.status,
                }))}
                placeholder="Pick from your roster…"
                searchPlaceholder="Search your roster…"
              />
            </div>
            <div>
              <label htmlFor="their_houseguest_id" className="label">You get</label>
              <EntityCombobox
                name="their_houseguest_id"
                required
                items={receiveOptions}
                placeholder="Pick from another team or unclaimed…"
                searchPlaceholder="Search rosters and unclaimed…"
              />
            </div>
          </div>
          {leftoverHouseguests.length > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-zinc-500">
              <GavelIcon className="h-3.5 w-3.5" />{" "}
              {leftoverHouseguests.length} unclaimed houseguest
              {leftoverHouseguests.length === 1 ? "" : "s"} floating in the house — claims
              always need the commissioner&apos;s gavel.
            </p>
          )}
          {league.trade_approval_required && (
            <p className="flex items-center gap-1.5 text-xs text-zinc-500">
              <GavelIcon className="h-3.5 w-3.5" /> This league requires commissioner approval — accepted trades wait for the gavel.
            </p>
          )}
          <FormNotice state={proposeState} />
          <SubmitButton pendingLabel="Slipping the note…">Propose trade</SubmitButton>
        </form>
      )}

      {league.status !== "active" && (
        <Card>
          <CardContent className="p-4 text-sm text-zinc-600">
            {league.status === "completed"
              ? "The season is over — the trade window is closed."
              : "Trades open once the draft is complete."}
          </CardContent>
        </Card>
      )}

      <FormNotice state={respondState} />
      <FormNotice state={approveState} />

      {/* Trade list */}
      <Card>
        <CardContent>
        <h2 className="font-bold">Trade Log</h2>
        {trades.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No trades yet. Somebody start a showmance— er, a swap.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {trades.map((t) => {
              const isPoolTrade = t.recipient_member_id === null;
              const give = t.items.find((i) => i.from_member_id === t.proposer_member_id);
              const get = isPoolTrade
                ? t.items.find((i) => i.from_member_id === null)
                : t.items.find((i) => i.from_member_id === t.recipient_member_id);
              const iAmRecipient = t.recipient?.user_id === currentUserId;
              const canRespond = t.status === "pending" && iAmRecipient;
              const canApprove =
                t.status === "accepted" &&
                isCommissioner &&
                (league.trade_approval_required || isPoolTrade);

              return (
                <li key={t.id} className="rounded-xl border border-black/15 surface-row p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm">
                      <span className="font-semibold">{t.proposer?.team_name}</span>
                      <span className="text-zinc-500"> sends </span>
                      {give?.houseguest && (
                        <HgAvatar name={give.houseguest.name} imageUrl={give.houseguest.image_url} size="xs" />
                      )}
                      <span className="font-semibold text-[#f7941d]">{give?.houseguest?.name}</span>
                      <span className="text-zinc-500"> for </span>
                      {get?.houseguest && (
                        <HgAvatar name={get.houseguest.name} imageUrl={get.houseguest.image_url} size="xs" />
                      )}
                      <span className="font-semibold text-[#9747ff]">{get?.houseguest?.name}</span>
                      {isPoolTrade ? (
                        <span className="text-zinc-500"> from the house</span>
                      ) : (
                        <>
                          <span className="text-zinc-500"> from </span>
                          <span className="font-semibold">{t.recipient?.team_name}</span>
                        </>
                      )}
                    </p>
                    <Badge variant={TRADE_STATUS_STYLES[t.status]}>
                      {TRADE_STATUS_LABELS[t.status]}
                    </Badge>
                  </div>

                  {(canRespond || canApprove) && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-black/10 pt-3">
                      {canRespond && (
                        <>
                          <form action={respondAction}>
                            <input type="hidden" name="trade_id" value={t.id} />
                            <input type="hidden" name="league_id" value={league.id} />
                            <input type="hidden" name="decision" value="accept" />
                            <SubmitButton pendingLabel="…" variant="primary" className="!px-3 !py-1.5 !text-xs">
                              <CheckTokenIcon className="h-3.5 w-3.5" /> Accept
                            </SubmitButton>
                          </form>
                          <form action={respondAction}>
                            <input type="hidden" name="trade_id" value={t.id} />
                            <input type="hidden" name="league_id" value={league.id} />
                            <input type="hidden" name="decision" value="reject" />
                            <SubmitButton pendingLabel="…" variant="danger" className="!px-3 !py-1.5 !text-xs">
                              <XTokenIcon className="h-3.5 w-3.5" /> Reject
                            </SubmitButton>
                          </form>
                        </>
                      )}
                      {canApprove && (
                        <>
                          <form action={approveAction}>
                            <input type="hidden" name="trade_id" value={t.id} />
                            <input type="hidden" name="league_id" value={league.id} />
                            <input type="hidden" name="decision" value="approve" />
                            <SubmitButton pendingLabel="…" variant="primary" className="!px-3 !py-1.5 !text-xs">
                              <GavelIcon className="h-3.5 w-3.5" /> Approve (backdoor it)
                            </SubmitButton>
                          </form>
                          <form action={approveAction}>
                            <input type="hidden" name="trade_id" value={t.id} />
                            <input type="hidden" name="league_id" value={league.id} />
                            <input type="hidden" name="decision" value="veto" />
                            <SubmitButton pendingLabel="…" variant="danger" className="!px-3 !py-1.5 !text-xs">
                              <ShieldIcon className="h-3.5 w-3.5" /> Veto
                            </SubmitButton>
                          </form>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
