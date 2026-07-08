"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/lib/actions/auth";
import { FormNotice } from "@/components/FormNotice";
import { SubmitButton } from "@/components/SubmitButton";
import { HouseTokenIcon } from "@/components/icons";
import { useActionToast } from "@/lib/useActionToast";

export default function SignupPage() {
  const [state, action] = useActionState(signUp, null);
  useActionToast(state);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="type-board-medium mb-8 flex items-center justify-center gap-2 text-center">
          <HouseTokenIcon /> House<span className="text-[#f7941d]">Draft</span>
        </Link>
        <div className="card p-8">
          <h1 className="type-instruction-heading-medium">Move into the house</h1>
          <p className="mt-1 text-sm text-zinc-600">Create your account. Expect the vote to flip.</p>
          <form action={action} className="mt-6 space-y-4">
            <div>
              <label htmlFor="username" className="label">Username</label>
              <input id="username" name="username" type="text" required minLength={3} maxLength={24} className="input" placeholder="superfan99" />
            </div>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" placeholder="At least 8 characters" />
            </div>
            <FormNotice state={state} />
            <SubmitButton pendingLabel="Moving you in…" className="w-full">
              Sign up
            </SubmitButton>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-zinc-600">
          Already inside?{" "}
          <Link href="/login" className="font-semibold text-[#f7941d] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
