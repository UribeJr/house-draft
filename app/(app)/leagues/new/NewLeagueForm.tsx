"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createLeague } from "@/lib/actions/leagues";
import { createSeason } from "@/lib/actions/seasons";
import { FormNotice } from "@/components/FormNotice";
import { SubmitButton } from "@/components/SubmitButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiceIcon } from "@/components/icons";
import { useActionToast } from "@/lib/useActionToast";

type Season = { id: string; name: string };

export function NewLeagueForm({ seasons }: { seasons: Season[] }) {
  const [state, action] = useActionState(createLeague, null);
  const [seasonState, seasonAction] = useActionState(createSeason, null);
  useActionToast(state);
  useActionToast(seasonState);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="type-instruction-heading-medium">Create a League</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Set the house rules. You&apos;ll be the commissioner.
      </p>

      {seasons.length === 0 ? (
        <div className="card mt-6 p-6">
          <h2 className="font-bold">First: create a season</h2>
          <p className="mt-1 text-sm text-zinc-600">
            A season holds the cast of houseguests your league will draft. Create
            one, add the cast, then come back.
          </p>
          <form action={seasonAction} className="mt-4 space-y-4">
            <div>
              <label htmlFor="season_name" className="label">Season name</label>
              <input id="season_name" name="name" required className="input" placeholder="Big Brother 27" />
            </div>
            <FormNotice state={seasonState} />
            <SubmitButton pendingLabel="Building the house…">Create season</SubmitButton>
          </form>
        </div>
      ) : (
        <form action={action} className="card mt-6 space-y-5 p-6">
          <div>
            <label htmlFor="name" className="label">League name</label>
            <input id="name" name="name" required minLength={2} maxLength={60} className="input" placeholder="The Backyard Alliance" />
          </div>

          <div>
            <label htmlFor="season_id" className="label">Season</label>
            <Select name="season_id" required defaultValue={seasons[0]?.id}>
              <SelectTrigger id="season_id" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-xs text-zinc-500">
              Need a different cast?{" "}
              <Link href="/seasons/new" className="text-[#f7941d] hover:underline">
                Create a new season
              </Link>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="roster_size" className="label">Roster size</label>
              <Select name="roster_size" defaultValue="4">
                <SelectTrigger id="roster_size" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} houseguests</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="label">Draft type</label>
              <div className="input flex items-center gap-1.5 surface-row text-zinc-600">
                <DiceIcon className="h-3.5 w-3.5" /> Snake
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="team_name" className="label">Your team name</label>
            <input id="team_name" name="team_name" required minLength={2} maxLength={32} className="input" placeholder="Nominated 4 Nothing" />
          </div>

          <div className="space-y-3 rounded-xl border border-black/15 surface-row p-4">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="font-semibold">Trades enabled</span>
                <span className="block text-xs text-zinc-500">Members can swap houseguests 1-for-1</span>
              </span>
              <input
                type="checkbox"
                name="trades_enabled"
                defaultChecked
                className="h-5 w-5 accent-[#f7941d]"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="font-semibold">Commissioner approval for trades</span>
                <span className="block text-xs text-zinc-500">Accepted trades wait for your blessing</span>
              </span>
              <input
                type="checkbox"
                name="trade_approval_required"
                className="h-5 w-5 accent-[#f7941d]"
              />
            </label>
          </div>

          <FormNotice state={state} />
          <SubmitButton pendingLabel="Building the house…" className="w-full">
            Create league
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
