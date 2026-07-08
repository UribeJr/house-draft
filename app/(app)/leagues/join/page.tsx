"use client";

import { useActionState } from "react";
import { joinLeague } from "@/lib/actions/leagues";
import { FormNotice } from "@/components/FormNotice";
import { SubmitButton } from "@/components/SubmitButton";
import { useActionToast } from "@/lib/useActionToast";

export default function JoinLeaguePage() {
  const [state, action] = useActionState(joinLeague, null);
  useActionToast(state);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="type-instruction-heading-medium">Join a League</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Got a key to the house? Enter your invite code.
      </p>
      <form action={action} className="card mt-6 space-y-5 p-6">
        <div>
          <label htmlFor="invite_code" className="label">Invite code</label>
          <input
            id="invite_code"
            name="invite_code"
            required
            maxLength={6}
            className="input type-instruction-body-large text-center uppercase tracking-[0.4em]"
            placeholder="ABC123"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="team_name" className="label">Your team name</label>
          <input id="team_name" name="team_name" required minLength={2} maxLength={32} className="input" placeholder="Floaters Grab a Vest" />
        </div>
        <FormNotice state={state} />
        <SubmitButton pendingLabel="Checking the guest list…" className="w-full">
          Join league
        </SubmitButton>
      </form>
    </div>
  );
}
