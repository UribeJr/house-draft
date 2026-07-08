"use client";

import { useActionState } from "react";
import { createSeason } from "@/lib/actions/seasons";
import { FormNotice } from "@/components/FormNotice";
import { SubmitButton } from "@/components/SubmitButton";
import { useActionToast } from "@/lib/useActionToast";

export default function NewSeasonPage() {
  const [state, action] = useActionState(createSeason, null);
  useActionToast(state);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="type-instruction-heading-medium">New Season</h1>
      <p className="mt-1 text-sm text-zinc-600">
        A season is a cast of houseguests. You&apos;ll add them next.
      </p>
      <form action={action} className="card mt-6 space-y-5 p-6">
        <div>
          <label htmlFor="name" className="label">Season name</label>
          <input id="name" name="name" required minLength={2} maxLength={80} className="input" placeholder="Big Brother 27" />
        </div>
        <FormNotice state={state} />
        <SubmitButton pendingLabel="Building the set…" className="w-full">
          Create season
        </SubmitButton>
      </form>
    </div>
  );
}
