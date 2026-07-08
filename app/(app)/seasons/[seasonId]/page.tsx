import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CastManager } from "./CastManager";

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ seasonId: string }>;
}) {
  const { seasonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: season } = await supabase
    .from("seasons")
    .select("id, name, created_by")
    .eq("id", seasonId)
    .single();
  if (!season) notFound();

  const { data: houseguests } = await supabase
    .from("houseguests")
    .select("*")
    .eq("season_id", seasonId)
    .order("name");

  const isOwner = season.created_by === user!.id;

  return (
    <CastManager
      season={season}
      houseguests={houseguests ?? []}
      isOwner={isOwner}
    />
  );
}
