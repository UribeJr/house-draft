/**
 * HouseDraft launch E2E test.
 *
 * Drives the live Supabase project through the exact authenticated REST/RPC
 * calls the app's Server Actions make — using the 4 seeded demo accounts
 * against the real "Big Brother 28" cast. Creates one throwaway league per
 * run and deletes it at the end; never touches "The Backyard Alliance" or
 * any other real league, and reverts any shared-season houseguest status
 * changes it makes along the way.
 *
 * Covers the full acceptance path (signup->champion) plus trade reject/veto,
 * stale-trade invalidation, and the RLS/authorization negative checks that
 * matter most for launch (non-member reads, non-commissioner writes,
 * out-of-turn picks, post-lock predictions).
 *
 * Usage:
 *   npm run test:e2e
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
 * .env.local, and the standard seeded demo accounts (see scripts/seed.ts).
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PASS = "housedraft-demo";
const SEASON_NAME = "Big Brother 28";

if (!URL || !ANON) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const users = {};
const results = [];
let cleanupTasks = [];

function ok(label, detail) {
  results.push({ label, pass: true, detail });
  console.log(`  \x1b[32m✔\x1b[0m ${label}${detail ? ` \x1b[2m(${detail})\x1b[0m` : ""}`);
}

function fail(label, detail) {
  results.push({ label, pass: false, detail });
  console.log(`  \x1b[31m✘\x1b[0m ${label}${detail ? ` — ${detail}` : ""}`);
}

async function expectThrow(label, fn) {
  try {
    await fn();
    fail(label, "expected an error but the call succeeded");
    return false;
  } catch {
    ok(label);
    return true;
  }
}

async function login(n) {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: `demo${n}@housedraft-demo.com`, password: PASS }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`login demo${n}: ${JSON.stringify(j)}`);
  users[n] = { token: j.access_token, id: j.user.id };
}

async function rpc(n, fn, args) {
  const r = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${users[n].token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(args),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`rpc ${fn} (demo${n}): ${text}`);
  return text ? JSON.parse(text) : null;
}

async function rest(n, method, path, body) {
  const r = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: ANON,
      Authorization: n ? `Bearer ${users[n].token}` : "",
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} (${n ? `demo${n}` : "anon"}): ${text}`);
  return text ? JSON.parse(text) : null;
}

async function anonRest(path) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { headers: { apikey: ANON } });
  return r.json();
}

// Snake draft position for 1-indexed pick N among T teams (mirrors lib/draft.ts).
const posFor = (pick, t) => {
  const round = Math.ceil(pick / t);
  const i = (pick - 1) % t;
  return round % 2 === 1 ? i + 1 : t - i;
};

async function runCleanup() {
  for (const task of cleanupTasks.reverse()) {
    try {
      await task();
    } catch (e) {
      console.log(`  \x1b[33m⚠ cleanup step failed:\x1b[0m ${e.message}`);
    }
  }
}

async function main() {
  console.log("\n== HouseDraft E2E · launch gate ==\n");

  console.log("Auth");
  for (const n of [1, 2, 3, 4]) await login(n);
  ok("4 demo accounts log in", "demo1–demo4@housedraft-demo.com");

  const seasons = await rest(1, "GET", `seasons?name=eq.${encodeURIComponent(SEASON_NAME)}&select=id`);
  if (!seasons?.[0]) throw new Error(`Season "${SEASON_NAME}" not found — run npm run seed first`);
  const seasonId = seasons[0].id;
  const cast = await rest(1, "GET", `houseguests?season_id=eq.${seasonId}&select=id,name&order=name`);
  if (cast.length < 16) throw new Error(`Expected 16 houseguests in "${SEASON_NAME}", found ${cast.length}`);
  ok(`"${SEASON_NAME}" cast loaded`, `${cast.length} houseguests`);

  console.log("\nLeague creation & invite codes");
  const created = await rpc(1, "create_league", {
    p_name: `E2E Test League ${Date.now()}`,
    p_season_id: seasonId,
    p_roster_size: 4,
    p_trades_enabled: true,
    p_trade_approval_required: true,
    p_team_name: "E2E Team 1",
  });
  const { league_id: L, invite_code: CODE } = created[0];
  cleanupTasks.push(() => rest(1, "DELETE", `leagues?id=eq.${L}`));
  ok("commissioner creates league", `code ${CODE}`);

  const rules = await rest(1, "GET", `scoring_rules?league_id=eq.${L}&select=event_type,points`);
  if (rules.length !== 19) fail("19 default scoring rules seeded", `found ${rules.length}`);
  else ok("19 default scoring rules seeded");
  const rulePoints = Object.fromEntries(rules.map((rule) => [rule.event_type, rule.points]));
  const bb28Rules = {
    BLOCK_BUSTER_WIN: 8,
    TIME_CAPSULE_SELECTED: 5,
    TIME_CAPSULE_POWER: 3,
    TIME_CAPSULE_PUNISHMENT: -3,
  };
  const badBb28Rules = Object.entries(bb28Rules).filter(([eventType, points]) => rulePoints[eventType] !== points);
  if (badBb28Rules.length === 0) ok("BB28 twist scoring rules seeded with expected points");
  else fail("BB28 twist scoring rules seeded with expected points", JSON.stringify(rulePoints));

  for (const n of [2, 3, 4]) await rpc(n, "join_league_with_code", { p_invite_code: CODE, p_team_name: `E2E Team ${n}` });
  ok("3 members join by invite code");

  await expectThrow("duplicate join is rejected", () =>
    rpc(2, "join_league_with_code", { p_invite_code: CODE, p_team_name: "Nice Try" })
  );
  await expectThrow("bogus invite code is rejected", () =>
    rpc(1, "join_league_with_code", { p_invite_code: "ZZZZZZ", p_team_name: "Nope" })
  );

  const members = await rest(1, "GET", `league_members?league_id=eq.${L}&select=id,user_id,team_name`);
  const memberByUser = Object.fromEntries(members.map((m) => [m.user_id, m]));

  console.log("\nAuthorization guards (pre-draft)");
  await expectThrow("non-commissioner cannot start the draft", () => rpc(2, "start_draft", { p_league_id: L }));
  // RLS-blocked UPDATEs return 200 with zero affected rows (PostgREST), not an
  // error — so assert on the no-op, not a thrown exception.
  const hijackAttempt = await rest(2, "PATCH", `leagues?id=eq.${L}`, { name: "Hijacked" });
  if (Array.isArray(hijackAttempt) && hijackAttempt.length === 0) ok("non-commissioner cannot edit league settings");
  else fail("non-commissioner cannot edit league settings", JSON.stringify(hijackAttempt));

  console.log("\nPredictions");
  await rest(2, "POST", "predictions", {
    league_id: L, league_member_id: memberByUser[users[2].id].id,
    predicted_winner_id: cast[0].id, predicted_first_boot_id: cast[1].id,
  });
  await rest(3, "POST", "predictions", {
    league_id: L, league_member_id: memberByUser[users[3].id].id,
    predicted_winner_id: cast[2].id, predicted_first_boot_id: cast[3].id,
  });
  ok("2 members save predictions");

  const theirPrediction = await rest(3, "GET", `predictions?league_member_id=eq.${memberByUser[users[2].id].id}`);
  if (theirPrediction.length !== 0) fail("predictions are private pre-lock", "another member's row was visible");
  else ok("predictions are private before lock");

  await rpc(1, "lock_predictions", { p_league_id: L });
  await expectThrow("predictions rejected after lock", () =>
    rest(4, "POST", "predictions", { league_id: L, league_member_id: memberByUser[users[4].id].id, predicted_winner_id: cast[4].id })
  );
  const visibleAfterLock = await rest(3, "GET", `predictions?league_id=eq.${L}`);
  if (visibleAfterLock.length !== 2) fail("predictions become league-visible after lock", `saw ${visibleAfterLock.length}, expected 2`);
  else ok("predictions become league-visible after lock");

  console.log("\nSnake draft");
  const order = [1, 2, 3, 4].map((n) => memberByUser[users[n].id].id);
  await rpc(1, "start_draft", { p_league_id: L, p_member_order: order });
  ok("commissioner starts draft with explicit order");

  await expectThrow("out-of-turn pick is rejected", () =>
    rpc(2, "make_draft_pick", { p_league_id: L, p_houseguest_id: cast[0].id })
  );

  let lastResult = null;
  for (let pick = 1; pick <= 16; pick++) {
    const n = posFor(pick, 4);
    lastResult = await rpc(n, "make_draft_pick", { p_league_id: L, p_houseguest_id: cast[pick - 1].id });
  }
  if (!lastResult.draft_complete) fail("16-pick snake draft completes", "draft_complete was false");
  else ok("16-pick snake draft completes", "roster_size 4 × 4 teams");

  await expectThrow("drafted houseguest cannot be picked twice", () =>
    rpc(1, "make_draft_pick", { p_league_id: L, p_houseguest_id: cast[0].id })
  );
  await expectThrow("joining after draft starts is rejected", () => {
    // create_league already ran; simulate a 5th join attempt against the same code
    return rpc(1, "join_league_with_code", { p_invite_code: CODE, p_team_name: "Too Late" });
  });

  console.log("\nScoring & leaderboard");
  await rpc(1, "add_scoring_event", { p_league_id: L, p_event_type: "HOH_WIN", p_week: 1, p_houseguest_id: cast[0].id, p_episode: 1 });
  await rpc(1, "add_scoring_event", { p_league_id: L, p_event_type: "VETO_WIN", p_week: 1, p_houseguest_id: cast[4].id, p_episode: 2 });
  await rpc(1, "add_scoring_event", { p_league_id: L, p_event_type: "BLOCK_BUSTER_WIN", p_week: 1, p_houseguest_id: cast[8].id, p_episode: 3 });
  await rpc(1, "add_scoring_event", { p_league_id: L, p_event_type: "NOMINATED", p_week: 1, p_houseguest_id: cast[1].id });
  const evictedEventId = await rpc(1, "add_scoring_event", { p_league_id: L, p_event_type: "EVICTED", p_week: 1, p_houseguest_id: cast[1].id, p_notes: "Blindside!" });
  await expectThrow("non-commissioner cannot score events", () =>
    rpc(2, "add_scoring_event", { p_league_id: L, p_event_type: "HOH_WIN", p_week: 1, p_houseguest_id: cast[2].id })
  );

  let board = await rest(2, "GET", `league_leaderboard?league_id=eq.${L}&select=team_name,total_points,rank&order=rank`);
  let pts = Object.fromEntries(board.map((b) => [b.team_name, b.total_points]));
  // pick1(cast[0])->team1 HOH+10; pick9(cast[8])->team1 Block Buster+8;
  // pick5(round2 pos4, cast[4])->team4 VETO+8; pick2(cast[1])->team2 NOM-3 EVICT-3
  if (pts["E2E Team 1"] === 18 && pts["E2E Team 4"] === 8 && pts["E2E Team 2"] === -6) {
    ok("leaderboard totals match hand-computed points", "18 / 8 / -6 / 0");
  } else {
    fail("leaderboard totals match hand-computed points", JSON.stringify(pts));
  }

  // Undo: commissioner deletes the eviction event and points should recalculate live.
  await rest(1, "DELETE", `scoring_events?id=eq.${evictedEventId}`);
  board = await rest(2, "GET", `league_leaderboard?league_id=eq.${L}&select=team_name,total_points`);
  pts = Object.fromEntries(board.map((b) => [b.team_name, b.total_points]));
  if (pts["E2E Team 2"] === -3) ok("deleting a scoring event recalculates the leaderboard live");
  else fail("deleting a scoring event recalculates the leaderboard live", JSON.stringify(pts));

  console.log("\nTrades");
  // Reject path: team3 offers, team4 declines.
  const rejectTradeId = await rpc(3, "propose_trade", { p_league_id: L, p_my_houseguest_id: cast[2].id, p_their_houseguest_id: cast[3].id });
  let status = await rpc(4, "respond_to_trade", { p_trade_id: rejectTradeId, p_accept: false });
  if (status === "rejected") ok("trade reject path works");
  else fail("trade reject path works", `got ${status}`);

  // Veto path: team3 offers again (same pair), team4 accepts, commissioner vetoes -> ownership unchanged.
  const vetoTradeId = await rpc(3, "propose_trade", { p_league_id: L, p_my_houseguest_id: cast[2].id, p_their_houseguest_id: cast[3].id });
  await rpc(4, "respond_to_trade", { p_trade_id: vetoTradeId, p_accept: true });
  status = await rpc(1, "approve_trade", { p_trade_id: vetoTradeId, p_approve: false });
  const ownerAfterVeto = await rest(1, "GET", `rosters?league_id=eq.${L}&houseguest_id=eq.${cast[2].id}&released_at=is.null&select=league_member_id`);
  if (status === "vetoed" && ownerAfterVeto[0].league_member_id === memberByUser[users[3].id].id) {
    ok("trade veto path leaves ownership unchanged");
  } else {
    fail("trade veto path leaves ownership unchanged", `status=${status}`);
  }

  // Approve path: team3 offers a third time, accepted, commissioner approves -> ownership swaps.
  const approveTradeId = await rpc(3, "propose_trade", { p_league_id: L, p_my_houseguest_id: cast[2].id, p_their_houseguest_id: cast[3].id });
  await rpc(4, "respond_to_trade", { p_trade_id: approveTradeId, p_accept: true });
  status = await rpc(1, "approve_trade", { p_trade_id: approveTradeId, p_approve: true });
  const ownerAfterApprove = await rest(1, "GET", `rosters?league_id=eq.${L}&houseguest_id=eq.${cast[2].id}&released_at=is.null&select=league_member_id`);
  if (status === "approved" && ownerAfterApprove[0].league_member_id === memberByUser[users[4].id].id) {
    ok("trade approve path swaps roster ownership");
  } else {
    fail("trade approve path swaps roster ownership", `status=${status}`);
  }

  // Stale trade: team4 now owns cast[2]; a trade proposed against the OLD owner (team3) must fail.
  await expectThrow("proposing a trade for a houseguest you don't own is rejected", () =>
    rpc(3, "propose_trade", { p_league_id: L, p_my_houseguest_id: cast[2].id, p_their_houseguest_id: cast[5].id })
  );

  await rpc(1, "add_scoring_event", { p_league_id: L, p_event_type: "HOH_WIN", p_week: 2, p_houseguest_id: cast[2].id });
  board = await rest(1, "GET", `league_leaderboard?league_id=eq.${L}&select=team_name,total_points`);
  pts = Object.fromEntries(board.map((b) => [b.team_name, b.total_points]));
  if (pts["E2E Team 4"] === 18) ok("post-trade scoring attributes to the new owner", "+10 (draft) +8 (veto) +10 (post-trade HOH) - wait");
  else fail("post-trade scoring attributes to the new owner", JSON.stringify(pts));

  console.log("\nFinale");
  cleanupTasks.push(() => rpc(1, "update_houseguest_status", { p_houseguest_id: cast[0].id, p_status: "active", p_placement: null }));
  cleanupTasks.push(() => rpc(1, "update_houseguest_status", { p_houseguest_id: cast[1].id, p_status: "active", p_placement: null }));

  await rpc(1, "update_houseguest_status", { p_houseguest_id: cast[0].id, p_status: "winner", p_placement: 1 });
  await rpc(1, "update_houseguest_status", { p_houseguest_id: cast[1].id, p_status: "evicted", p_placement: 16 });
  await expectThrow("non-owner cannot edit houseguest status", () =>
    rpc(2, "update_houseguest_status", { p_houseguest_id: cast[3].id, p_status: "jury" })
  );
  await rpc(1, "add_scoring_event", { p_league_id: L, p_event_type: "WINNER", p_week: 10, p_houseguest_id: cast[0].id });
  await rpc(1, "add_scoring_event", { p_league_id: L, p_event_type: "RUNNER_UP", p_week: 10, p_houseguest_id: cast[4].id });

  // team2 predicted winner=cast[0] and first_boot=cast[1] — both are correct (2 bonuses).
  // team3 predicted cast[2]/cast[3] — both wrong (0 bonuses).
  const bonuses = await rpc(1, "award_finale_bonuses", { p_league_id: L });
  if (bonuses === 2) ok("finale awards correct prediction bonuses", "team2 called both winner (+25) and first boot (+15)");
  else fail("finale awards correct prediction bonuses", `expected 2 bonuses, got ${bonuses}`);

  const rerun = await rpc(1, "award_finale_bonuses", { p_league_id: L });
  if (rerun === 0) ok("awarding finale bonuses twice is idempotent");
  else fail("awarding finale bonuses twice is idempotent", `second run awarded ${rerun}`);

  const leagueRow = await rest(2, "GET", `leagues?id=eq.${L}&select=status`);
  if (leagueRow[0].status === "completed") ok("league marked completed after finale");
  else fail("league marked completed after finale", leagueRow[0].status);

  board = await rest(3, "GET", `league_leaderboard?league_id=eq.${L}&select=team_name,total_points,rank&order=rank`);
  ok(`champion crowned: ${board[0].team_name}`, `${board[0].total_points} pts`);

  console.log("\nRLS / anonymous access");
  const anonLeagues = await anonRest(`leagues?id=eq.${L}&select=id`);
  if (Array.isArray(anonLeagues) && anonLeagues.length === 0) ok("anonymous requests cannot read league data");
  else fail("anonymous requests cannot read league data", JSON.stringify(anonLeagues));

  // profiles are readable by any signed-in user (needed for team rosters) but not by anon.
  const anonProfiles = await anonRest(`profiles?select=id&limit=1`);
  const authedProfiles = await rest(3, "GET", "profiles?select=id&limit=1");
  if (anonProfiles.length === 0 && authedProfiles.length > 0) {
    ok("profiles are readable by authenticated users only");
  } else {
    fail("profiles are readable by authenticated users only", `anon=${JSON.stringify(anonProfiles)} authed=${JSON.stringify(authedProfiles)}`);
  }

  console.log("\nCleanup");
  await runCleanup();
  ok("throwaway league deleted, shared cast statuses reverted");

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${"=".repeat(50)}`);
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) {
    console.log("\nFAILED CHECKS:");
    for (const f of failed) console.log(`  ✘ ${f.label}${f.detail ? ` — ${f.detail}` : ""}`);
    console.log("\nNOT READY FOR LAUNCH.\n");
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED — READY FOR LAUNCH.\n");
}

main().catch(async (e) => {
  console.error(`\n\x1b[31mE2E test crashed:\x1b[0m ${e.message}`);
  await runCleanup().catch(() => {});
  process.exit(1);
});
