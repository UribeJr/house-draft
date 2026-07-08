import Link from "next/link";
import { Mascot } from "@/components/Mascot";

export default function LeagueNotFound() {
  return (
    <div className="card mx-auto mt-16 flex max-w-md flex-col items-center px-6 py-12 text-center">
      <Mascot size="md" />
      <h2 className="mt-4 text-lg font-bold">You&apos;ve been evicted (or never moved in)</h2>
      <p className="mt-1 text-sm text-zinc-600">
        This league doesn&apos;t exist, or you&apos;re not a member. Ask the
        commissioner for an invite code.
      </p>
      <Link href="/dashboard" className="btn-primary mt-6">
        Back to my leagues
      </Link>
    </div>
  );
}
