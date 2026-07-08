"use client";

import { useActionState } from "react";
import { savePredictions, lockPredictions } from "@/lib/actions/predictions";
import { FormNotice } from "@/components/FormNotice";
import { HgAvatar } from "@/components/HgAvatar";
import { SubmitButton } from "@/components/SubmitButton";
import { EntityCombobox } from "@/components/EntityCombobox";
import { Card, CardContent } from "@/components/ui/card";
import { CrystalBallIcon, LockIcon, TrophyIcon, DoorExitIcon } from "@/components/icons";
import { useActionToast } from "@/lib/useActionToast";
import type { HouseguestStatus } from "@/lib/labels";

type Hg = { id: string; name: string; image_url: string | null; status: HouseguestStatus };

export function PredictionsForm({
  leagueId,
  memberId,
  houseguests,
  locked,
  isCommissioner,
  myWinnerName,
  myFirstBootName,
  leaguePredictions,
}: {
  leagueId: string;
  memberId: string | null;
  houseguests: Hg[];
  locked: boolean;
  isCommissioner: boolean;
  myWinnerName: string | null;
  myFirstBootName: string | null;
  leaguePredictions: {
    team: string;
    winner: string;
    winnerImg: string | null;
    firstBoot: string;
    firstBootImg: string | null;
  }[];
}) {
  const [state, action] = useActionState(savePredictions, null);
  const [lockState, lockAction] = useActionState(lockPredictions, null);
  useActionToast(state);
  useActionToast(lockState);

  const winnerDefault = houseguests.find((h) => h.name === myWinnerName)?.id ?? "";
  const bootDefault = houseguests.find((h) => h.name === myFirstBootName)?.id ?? "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="type-board-large flex items-center gap-2">
          <CrystalBallIcon className="h-5 w-5" /> Call Your Shot
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Predict the season winner (+25) and the first boot (+15) before the
          commissioner locks predictions. Receipts live in the Diary Room.
        </p>
      </div>

      {locked ? (
        <>
          <Card className="border-[#aad8fa]/30 bg-[#aad8fa]/5">
            <CardContent className="flex items-center gap-2 text-sm text-[#0072bb]">
              <LockIcon className="h-4 w-4" /> Predictions are locked. Here&apos;s what everyone called:
            </CardContent>
          </Card>
          <Card>
            <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="type-card-large text-left text-zinc-500">
                  <th className="pb-2">Team</th>
                  <th className="pb-2">Winner pick</th>
                  <th className="pb-2">First boot pick</th>
                </tr>
              </thead>
              <tbody>
                {leaguePredictions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-zinc-500">
                      Nobody made predictions before the lock. Bold strategy.
                    </td>
                  </tr>
                ) : (
                  leaguePredictions.map((p) => (
                    <tr key={p.team} className="border-t border-black/10">
                      <td className="py-2.5 font-semibold">{p.team}</td>
                      <td className="py-2.5">
                        <span className="flex items-center gap-2">
                          {p.winner !== "—" && <HgAvatar name={p.winner} imageUrl={p.winnerImg} size="xs" />}
                          <TrophyIcon className="h-3.5 w-3.5" /> {p.winner}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="flex items-center gap-2">
                          {p.firstBoot !== "—" && <HgAvatar name={p.firstBoot} imageUrl={p.firstBootImg} size="xs" />}
                          <DoorExitIcon className="h-3.5 w-3.5" /> {p.firstBoot}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </CardContent>
          </Card>
        </>
      ) : memberId ? (
        <form action={action} className="card space-y-5 p-6">
          <input type="hidden" name="league_id" value={leagueId} />
          <input type="hidden" name="league_member_id" value={memberId} />
          <div>
            <label htmlFor="predicted_winner_id" className="label">
              <span className="inline-flex items-center gap-1.5">
                <TrophyIcon className="h-3.5 w-3.5" /> Who wins the whole season? (+25 if right)
              </span>
            </label>
            <EntityCombobox
              name="predicted_winner_id"
              items={houseguests.map((h) => ({
                id: h.id,
                name: h.name,
                imageUrl: h.image_url,
                status: h.status,
              }))}
              defaultValue={winnerDefault}
              placeholder="Pick a houseguest…"
              searchPlaceholder="Search houseguests…"
              noPickLabel="No pick"
            />
          </div>
          <div>
            <label htmlFor="predicted_first_boot_id" className="label">
              <span className="inline-flex items-center gap-1.5">
                <DoorExitIcon className="h-3.5 w-3.5" /> Who&apos;s the first boot? (+15 if right)
              </span>
            </label>
            <EntityCombobox
              name="predicted_first_boot_id"
              items={houseguests.map((h) => ({
                id: h.id,
                name: h.name,
                imageUrl: h.image_url,
                status: h.status,
              }))}
              defaultValue={bootDefault}
              placeholder="Pick a houseguest…"
              searchPlaceholder="Search houseguests…"
              noPickLabel="No pick"
            />
          </div>
          <FormNotice state={state} />
          <SubmitButton pendingLabel="Filing your receipts…" className="w-full">
            Save predictions
          </SubmitButton>
        </form>
      ) : (
        <p className="text-sm text-zinc-500">Join the league to make predictions.</p>
      )}

      {isCommissioner && !locked && (
        <form
          action={lockAction}
          className="card flex flex-wrap items-center justify-between gap-3 border-[#9747ff]/30 bg-[#9747ff]/5 p-4"
        >
          <input type="hidden" name="league_id" value={leagueId} />
          <div className="text-sm">
            <p className="font-bold text-[#9747ff]">Commissioner: lock predictions</p>
            <p className="text-xs text-zinc-600">
              Usually right before draft night. Everyone&apos;s picks become visible. No takebacks.
            </p>
          </div>
          <SubmitButton pendingLabel="Locking…" variant="secondary" className="!border-[#9747ff]/30">
            <LockIcon className="h-4 w-4" /> Lock predictions
          </SubmitButton>
        </form>
      )}
      <FormNotice state={lockState} />
    </div>
  );
}
