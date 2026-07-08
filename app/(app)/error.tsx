"use client";

import { Mascot } from "@/components/Mascot";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card mx-auto mt-16 flex max-w-md flex-col items-center px-6 py-12 text-center">
      <Mascot size="md" />
      <h2 className="mt-4 text-lg font-bold">Technical difficulties in the house</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Something went wrong loading this page. {error.digest ? `(ref: ${error.digest})` : ""}
      </p>
      <button onClick={reset} className="btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
