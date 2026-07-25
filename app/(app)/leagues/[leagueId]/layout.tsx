import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeagueTabs } from "./LeagueTabs";
import { Badge } from "@/components/ui/badge";
import { TrophyIcon } from "@/components/icons";

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS: non-members get no row back.
  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, status, commissioner_id, season:seasons(name)")
    .eq("id", leagueId)
    .single();
  if (!league) notFound();

  const isCommissioner = league.commissioner_id === user!.id;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascot/egg-angela.png"
            alt="House Draft mascot"
            width={85}
            height={128}
            className="h-24 w-auto shrink-0 select-none sm:h-32"
            draggable={false}
          />
          <div className="min-w-0">
            <h1 className="type-instruction-heading-medium">{league.name}</h1>
            <p className="mt-1 text-sm text-zinc-600">{league.season?.name}</p>
          </div>
        </div>
        {league.status === "completed" && (
          <Badge className="bg-[#fef200] text-black">
            <TrophyIcon className="h-3.5 w-3.5" /> Season complete
          </Badge>
        )}
      </div>
      <LeagueTabs leagueId={league.id} isCommissioner={isCommissioner} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
