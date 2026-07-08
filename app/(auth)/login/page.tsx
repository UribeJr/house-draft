"use client";

import Link from "next/link";
import { useActionState } from "react";
import { logIn } from "@/lib/actions/auth";
import { FormNotice } from "@/components/FormNotice";
import { SubmitButton } from "@/components/SubmitButton";
import { HouseTokenIcon } from "@/components/icons";
import { useActionToast } from "@/lib/useActionToast";

export default function LoginPage() {
  const [state, action] = useActionState(logIn, null);
  useActionToast(state);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="type-board-medium mb-8 flex items-center justify-center gap-2 text-center">
          <HouseTokenIcon /> House<span className="text-[#f7941d]">Draft</span>
        </Link>
        <div className="card p-8">
          <h1 className="type-instruction-heading-medium">Welcome back to the house</h1>
          <p className="mt-1 text-sm text-zinc-600">Log in to check the leaderboard.</p>
          <form action={action} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input id="password" name="password" type="password" required autoComplete="current-password" className="input" placeholder="••••••••" />
            </div>
            <FormNotice state={state} />
            <SubmitButton pendingLabel="Unlocking the door…" className="w-full">
              Log in
            </SubmitButton>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-zinc-600">
          New houseguest?{" "}
          <Link href="/signup" className="font-semibold text-[#f7941d] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
