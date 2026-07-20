/**
 * HouseDraft demo seed.
 *
 * Creates:
 *  - the "Big Brother 28" season with the real 16-person cast + headshots
 *  - 4 confirmed demo users (demo1..demo4@housedraft-demo.com / password below)
 *  - a demo league ("The Backyard Alliance") created + joined through the real
 *    RPCs, so this doubles as a smoke test of create_league / join_league_with_code
 *
 * Usage:
 *   1. Put SUPABASE_SERVICE_ROLE_KEY in .env.local (Dashboard -> Settings -> API keys)
 *   2. npm run seed
 *
 * Idempotent-ish: re-running skips anything that already exists.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !SERVICE_KEY || !ANON_KEY) {
  console.error(
    "Missing env. Need NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = "housedraft-demo";
const SEASON_NAME = "Big Brother 28";
const LEAGUE_NAME = "The Backyard Alliance";

// The real BB28 cast (official reveal, July 7 2026). Image URLs hotlink the
// Big Brother Fandom wiki's "_Large" portrait headshots (1024x1280,
// static.wikia.nocookie.net — a separate, unprotected CDN from the
// Cloudflare-gated wiki pages themselves) as a fallback for fresh installs;
// the production DB re-hosts these in the houseguest-images Storage bucket.
// Rick Devens has no photo on the wiki yet, so his hotlink stays on
// Big Brother Network's cast gallery.
const WIKI_IMG = "https://static.wikia.nocookie.net/bigbrother/images";
const BBN_IMG = "https://bigbrothernetwork.com/wp-content/uploads";
const CAST: Array<[string, number, string, string, string | null]> = [
  ["Dee Valladares", 29, "Miami, FL", "Entrepreneur (Survivor winner)", null],
  ["Barrett Pfeiffer", 27, "Benton, AR", "Jumbotron Engineer", `${WIKI_IMG}/f/f2/US28_Barrett_Large.jpg`],
  ["Chuk Anyanwu", 27, "Dallas, TX", "Supply Chain Analyst", `${WIKI_IMG}/8/8c/US28_Chuk_Large.jpg`],
  ["Drew Campbell", 22, "Temecula, CA", "Surgical Dental Assistant", `${WIKI_IMG}/2/2b/US28_Drew_Large.jpg`],
  ["Haley Thogmartin", 29, "Neosho, MO", "Telemedicine Executive", `${WIKI_IMG}/6/61/US28_Haley_Large.jpg`],
  ["Jason De Puy", 35, "San Francisco, CA", "Drag Queen (Salina EsTitties)", `${WIKI_IMG}/e/e5/US28_Jason_Large.jpg`],
  ["Kamu Kirk", 32, "Phoenix, AZ", "MMA Fighter", `${WIKI_IMG}/0/0e/US28_Kamu_Large.jpg`],
  ["LaTrice Verrett", 57, "Kankakee, IL", "Boutique Salesperson", `${WIKI_IMG}/0/0a/US28_LaTrice_Large.jpg`],
  ["Lyric Medeiros", 25, "Honolulu, HI", "Attorney", `${WIKI_IMG}/8/8f/US28_Lyric_Large.jpg`],
  ["Mallory Aurichio", 24, "Township of Washington, NJ", "Rocket Scientist", `${WIKI_IMG}/1/11/US28_Mallory_Large.jpg`],
  ["Melody Morris", 24, "Thornton, CO", "Corporate Game Show Host", `${WIKI_IMG}/f/f6/US28_Melody_Large.jpg`],
  ["Rome Seymour", 28, "Traverse City, MI", "Pickleball Coach", `${WIKI_IMG}/1/10/US28_Rome_Large.jpg`],
  ["Taylor Brown", 27, "Deerfield Beach, FL", "Elementary School Counselor", `${WIKI_IMG}/d/d7/US28_Taylor_Large.jpg`],
  ["Yash Patel", 24, "Monroe Township, NJ", "Financial Analyst", `${WIKI_IMG}/a/a2/US28_Yash_Large.jpg`],
  ["Rick Devens", 42, "Macon, GA", "News Anchor (Survivor vet)", `${BBN_IMG}/2026/07/survivor-rick-devens-00.jpg`],
  ["Angela Murray", 53, "Syracuse, UT", "Real Estate Agent (BB26 vet)", `${WIKI_IMG}/3/3b/US26_Angela_Large.jpg`],
];

const DEMO_USERS = [1, 2, 3, 4].map((n) => ({
  email: `demo${n}@housedraft-demo.com`,
  username: `demoplayer${n}`,
  teamName: [
    "Nomination Nation",
    "The Floater Boaters",
    "Backdoor Bandits",
    "Jury Management LLC",
  ][n - 1],
}));

async function ensureUser(email: string, username: string): Promise<string> {
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) {
    console.log(`  user ${email} already exists`);
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { username },
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  console.log(`  created user ${email}`);
  return data.user.id;
}

/** Sign in as a demo user and return an anon-key client acting as them,
 *  so RPCs run through the real authenticated path (RLS + auth.uid()). */
async function asUser(email: string) {
  const client = createClient(URL!, ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email,
    password: DEMO_PASSWORD,
  });
  if (error) throw new Error(`signIn(${email}): ${error.message}`);
  return client;
}

async function main() {
  console.log("Seeding HouseDraft demo data…");

  // 1. Season + cast (service role; created_by = null marks it as the shared demo season)
  let { data: season } = await admin
    .from("seasons")
    .select("id")
    .eq("name", SEASON_NAME)
    .maybeSingle();
  if (!season) {
    const { data, error } = await admin
      .from("seasons")
      .insert({ name: SEASON_NAME, created_by: null })
      .select("id")
      .single();
    if (error) throw error;
    season = data;
    console.log(`  created season "${SEASON_NAME}"`);
  } else {
    console.log(`  season "${SEASON_NAME}" already exists`);
  }

  const { count } = await admin
    .from("houseguests")
    .select("id", { count: "exact", head: true })
    .eq("season_id", season.id);
  if ((count ?? 0) === 0) {
    const rows = CAST.map(([name, age, hometown, occupation, imageUrl]) => ({
      season_id: season!.id,
      name,
      age,
      hometown,
      occupation,
      image_url: imageUrl,
      status: "active" as const,
    }));
    const { error } = await admin.from("houseguests").insert(rows);
    if (error) throw error;
    console.log(`  added ${rows.length} houseguests`);
  } else {
    console.log(`  cast already seeded (${count} houseguests)`);
  }

  // 2. Demo users
  const userIds: string[] = [];
  for (const u of DEMO_USERS) userIds.push(await ensureUser(u.email, u.username));

  // 3. Demo league via real RPCs (smoke test)
  const { data: existingLeague } = await admin
    .from("leagues")
    .select("id, invite_code")
    .eq("name", LEAGUE_NAME)
    .maybeSingle();

  if (existingLeague) {
    console.log(`  league "${LEAGUE_NAME}" already exists (code ${existingLeague.invite_code})`);
  } else {
    const commish = await asUser(DEMO_USERS[0].email);
    const { data: created, error: createErr } = await commish.rpc("create_league", {
      p_name: LEAGUE_NAME,
      p_season_id: season.id,
      p_roster_size: 4,
      p_trades_enabled: true,
      p_trade_approval_required: true,
      p_team_name: DEMO_USERS[0].teamName,
    });
    if (createErr) throw new Error(`create_league: ${createErr.message}`);
    const league = created![0];
    console.log(`  created league "${LEAGUE_NAME}" — invite code ${league.invite_code}`);

    for (const u of DEMO_USERS.slice(1)) {
      const member = await asUser(u.email);
      const { error } = await member.rpc("join_league_with_code", {
        p_invite_code: league.invite_code,
        p_team_name: u.teamName,
      });
      if (error) throw new Error(`join(${u.email}): ${error.message}`);
      console.log(`  ${u.email} joined as "${u.teamName}"`);
    }
  }

  console.log("\nDone! Demo logins (password: " + DEMO_PASSWORD + "):");
  for (const u of DEMO_USERS) console.log(`  ${u.email}`);
  console.log(
    "\nLog in as demo1 to run the draft from the Commissioner Room, or create your own league against the demo season."
  );
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message ?? err);
  process.exit(1);
});
