import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Mascot } from "@/components/Mascot";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

const LEAGUE_STATUS_COPY: Record<
  string,
  { label: string; variant?: VariantProps<typeof badgeVariants>["variant"]; className?: string }
> = {
  setup: { label: "Pre-season", className: "border-black/20 bg-zinc-100 text-zinc-700" },
  drafting: { label: "Draft LIVE", variant: "trade-vetoed" },
  active: { label: "In season", variant: "status-active" },
  completed: { label: "Finale done", className: "bg-[#fef200] text-black" },
};

const CARD_BANDS = [
  "card-band-orange",
  "card-band-blue",
  "card-band-pink",
  "card-band-green",
  "card-band-yellow",
  "card-band-red",
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("league_members")
    .select("id, team_name, league:leagues(id, name, status, roster_size, commissioner_id, season:seasons(name))")
    .eq("user_id", user!.id)
    .order("joined_at", { ascending: false });

  const leagues = memberships ?? [];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="type-instruction-heading-medium">
            My Leagues
          </h1>
          <p className="mt-1 text-sm text-zinc-600">Every house you have a key to.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/leagues/join" className="btn-secondary">
            Join with code
          </Link>
          <Link href="/leagues/new" className="btn-primary">
            + Create League
          </Link>
        </div>
      </div>

      {leagues.length === 0 ? (
        <Card className="mt-8">
          <CardHeader band="blue">Welcome to the board</CardHeader>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <Mascot size="md" />
            <h2 className="mt-4 text-lg font-bold">The house is empty</h2>
            <p className="mt-1 max-w-sm text-sm text-zinc-600">
              Create your first league and invite your friends, or join one with an
              invite code. Draft night awaits.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/leagues/new" className="btn-primary">
                Create a league
              </Link>
              <Link href="/leagues/join" className="btn-secondary">
                Join a league
              </Link>
            </div>
            <p className="mono-footer mt-8 w-full">Monopoly</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.map((m, i) => {
            const league = m.league;
            if (!league) return null;
            const status = LEAGUE_STATUS_COPY[league.status] ?? LEAGUE_STATUS_COPY.setup;
            const band = CARD_BANDS[i % CARD_BANDS.length];
            return (
              <Link
                key={m.id}
                href={`/leagues/${league.id}`}
                className="card group overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-[0_4px_0_rgba(0,0,0,0.3)]"
              >
                <div className={`card-band ${band}`}>{league.name}</div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-zinc-600">{league.season?.name}</p>
                    <Badge variant={status.variant} className={status.className}>{status.label}</Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-semibold text-zinc-800">{m.team_name}</span>
                    {league.commissioner_id === user!.id && (
                      <Badge className="bg-[#aae0fa] text-black">Commissioner</Badge>
                    )}
                  </div>
                  <p className="mono-footer mt-4">Monopoly</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
