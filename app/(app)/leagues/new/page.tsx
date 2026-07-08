import { createClient } from "@/lib/supabase/server";
import { NewLeagueForm } from "./NewLeagueForm";

export default async function NewLeaguePage() {
  const supabase = await createClient();
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name")
    .order("created_at", { ascending: false });

  return <NewLeagueForm seasons={seasons ?? []} />;
}
