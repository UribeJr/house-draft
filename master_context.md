# HouseDraft — Master Context for Agents

Read this before touching anything. It captures the architecture, live infrastructure,
non-obvious decisions, and the traps already discovered so you don't rediscover them.
Last updated: 2026-09-07 (removed Made Jury scoring; Medieval Round Win).

## What this is

HouseDraft is a fantasy-league web app for Big Brother-style reality seasons:
users create/join leagues by invite code, snake-draft houseguests, the commissioner
enters episode scoring events (HOH, veto, nominations, evictions…), members make
1-for-1 trades, and a leaderboard runs through finale night where a league champion
is crowned. Full product spec + demo walkthrough: see `README.md`.

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 ·
Supabase (Auth via `@supabase/ssr` 0.12, Postgres 17, Storage) · deployable on Vercel.
No email sending, no payments, no websockets (polling).

## Game Rules & Scoring

Core flow: users create or join a league by invite code while the draft is pending;
the commissioner starts a snake draft; members draft houseguests into rosters; the
commissioner records episode events; optional 1-for-1 trades can swap ownership;
the leaderboard recomputes from scoring events until finale bonuses complete the league
and rank 1 is the champion.

Default scoring rules are seeded by `create_league` into `scoring_rules`:

| Event | Points |
| --- | ---: |
| HOH Win (`HOH_WIN`) | +10 |
| Veto Win (`VETO_WIN`) | +8 |
| Veto Used (`VETO_USED`) | +4 |
| Saved with Veto (`SAVED_WITH_VETO`) | +4 |
| Diamond Veto Used (`DIAMOND_VETO_USED`) | +6 |
| Survived Eviction Night (`SURVIVED_EVICTION`) | +3 |
| Nomination Chair (`NOMINATED`) | -3 |
| Replacement Nominee (`REPLACEMENT_NOMINEE`) | -2 |
| Evicted (`EVICTED`) | -3 |
| Made Final 5 (`MADE_FINAL_5`) | +15 |
| Made Final 3 (`MADE_FINAL_3`) | +20 |
| Runner-Up (`RUNNER_UP`) | +30 |
| Season Winner (`WINNER`) | +60 |
| America's Favorite (`AMERICA_FAVORITE`) | +25 |
| Block Buster Win (`BLOCK_BUSTER_WIN`) | +8 |
| Medieval Round Win (`MEDIEVAL_ROUND_WIN`) | +2 |
| Time Capsule Selected (`TIME_CAPSULE_SELECTED`) | +5 |
| Time Capsule Power-Up (`TIME_CAPSULE_POWER`) | +3 |
| Time Capsule Punishment (`TIME_CAPSULE_PUNISHMENT`) | -3 |
| Called the Winner (`CORRECT_WINNER_PICK`) | +25 |
| Called the First Boot (`CORRECT_FIRST_BOOT`) | +15 |

Only commissioners add scoring events. `add_scoring_event` snapshots the current
point value from `scoring_rules` into `scoring_events.points`, so later rule edits
do not rewrite old events. Standings are computed from events, not stored totals;
commissioner deletion of an event is the undo path and immediately changes the
leaderboard. Back-entered events must pass the real `occurred_at` timestamp if they
should credit the owner at that show moment instead of the entry time.

Houseguest events credit whichever league member owned that houseguest at
`occurred_at`, using roster ownership intervals. Prediction bonuses are team-level
events: they set `league_member_id` instead of `houseguest_id` and are unique per
member/event type. Finale flow is: mark real show facts on houseguests
(`status`/`placement`), enter winner/finale events as needed, run
`award_finale_bonuses` to idempotently award correct winner/first-boot picks, set the
league to `completed`, and treat `league_leaderboard.rank = 1` as champion.

## Live infrastructure — IMPORTANT

- **Supabase project:** `pifypixhlqppohchqxve` ("housedraft", org `qtzgwkxmdraspfubctxl`, us-east-1).
  URL `https://pifypixhlqppohchqxve.supabase.co`. Anon/publishable key is in `.env.local`.
- **DO NOT touch** the user's other Supabase project `susrmpoulqsmswhmjpyj` ("UribeJr's Project") —
  it holds live data for a *different* app whose table names (profiles, leagues,
  league_members, predictions) collide with ours.
- **Service-role key has never been available in-session.** It's a blank placeholder in
  `.env.local`. Anything admin-level was done via the Supabase MCP `execute_sql`/`apply_migration`
  tools, which run as `postgres` (RLS-bypassing). Prefer that path.
- **Schema-change protocol:** apply to the live project with MCP `apply_migration`
  (named, tracked) AND mirror the identical SQL into `supabase/migrations/*.sql` in
  the repo. Both must stay in sync — the repo files are the deliverable for fresh installs.
- **Vercel:** never deployed; the Vercel MCP server has never been authenticated.
  App is deploy-ready (env vars: URL + anon key only).

### Demo data (live in the DB)

- 4 confirmed users, password `housedraft-demo`:
  `demo1@housedraft-demo.com` … `demo4@housedraft-demo.com` (usernames demoplayer1–4).
- **demo1** is commissioner of league **"The Backyard Alliance"**
  (id `f170c310-cc7c-40d0-a2ac-b70140d7bf86`, roster 4, trades on, approval on,
  draft still `pending` as of last update) and owns season **"Big Brother 28"**
  (id `c1dd5026-36d4-4830-a940-2ed425b9e3e5`).
- The season holds the **real BB28 cast** (16 houseguests: 14 rookies + Rick Devens +
  Angela Murray), bios cross-checked from bigbrothernetwork.com + TVLine. Headshots are
  re-hosted in the public `houseguest-images` Storage bucket at
  `{season_id}/{houseguest_id}.jpg`. Two more "surprise" houseguests were rumored but
  unconfirmed — the commissioner can add them via the cast manager.

## Architecture — the load-bearing decisions

1. **RLS is the security boundary; the app ships only the anon key.** Server Actions
   use the user-scoped SSR client. Reads are plain RLS-guarded selects in server
   components; league pages 404 for non-members because RLS returns no row.
2. **Every multi-row/race-prone mutation is a `SECURITY DEFINER` Postgres RPC**
   (`supabase/migrations/20260707000005_rpcs.sql`): `create_league` (also seeds the 15
   default scoring rules + pending draft + invite code), `join_league_with_code`,
   `start_draft`, `make_draft_pick`, `propose_trade`, `respond_to_trade`, `approve_trade`,
   `add_scoring_event`, `lock_predictions`, `update_houseguest_status`, `award_finale_bonuses`.
   Each self-authorizes via `auth.uid()` (definer bypasses RLS!), raises `UPPER_SNAKE`
   error codes, and is granted to `authenticated` only. Internal helpers
   `_execute_trade` / `_trade_still_valid` are granted to no one.
3. **`make_draft_pick` serializes concurrency** with `SELECT … FOR UPDATE` on the
   `drafts` row. Snake math lives in BOTH the SQL and `lib/draft.ts` — keep them in sync:
   `round = ceil(N/T)`; position = forward on odd rounds, reversed on even.
4. **Points are never stored as totals.** `rosters` rows are immutable ownership
   *intervals* (`acquired_at` / `released_at`, half-open `[acquired, released)`).
   Trades close one interval and open another **at the same instant** (a 1 ms gap here
   was a real bug — events at the boundary attributed to nobody). Views
   (`member_scoring_events`, `league_leaderboard`, `weekly_scores` in migration 0006)
   join `scoring_events.occurred_at` into the owning interval. All views use
   `security_invoker = on` — without it they'd leak across leagues.
5. **Scoring events snapshot points** from `scoring_rules` at entry time; deleting an
   event (commissioner-only) instantly corrects standings. Team-level bonuses
   (CORRECT_WINNER_PICK / CORRECT_FIRST_BOOT) set `league_member_id` instead of
   `houseguest_id` (`check num_nonnulls(...) = 1`); a partial unique index makes
   `award_finale_bonuses` idempotent.
6. **RLS recursion** on league_members is avoided via definer helpers
   `is_league_member(uuid)` / `is_league_commissioner(uuid)` / `predictions_locked(uuid)`.
7. **Seasons/houseguests are global** (readable by all authenticated), writable by
   their `created_by` owner. Houseguest **status/placement** is editable by any
   commissioner of a league using that season (RPC `update_houseguest_status`) — they're
   facts of the show. First boot = houseguest whose `placement` = cast count.
8. **Trade lifecycle:** member swaps: `pending → rejected` | `pending → accepted`
   (executes immediately when `trade_approval_required=false`) | `accepted → approved`
   (executes) | `accepted → vetoed`. **Unclaimed pool claims** (leftover houseguests with
   no roster row): proposer sends one of theirs, gets an unowned guest; trade inserts as
   `accepted` and **always** awaits commissioner gavel (`recipient_member_id` and pool-side
   `trade_items.from_member_id` are NULL). On execute, the sent guest returns to the pool.
   Ownership is re-validated at execution; stale trades die.
9. **Joining is blocked once the draft starts** (mid-draft joins break snake math).
10. **Draft-room liveness = polling**: `components/Poller.tsx` calls `router.refresh()`
    every 2.5s while the draft is active. Upgrade path is Supabase Realtime on
    `drafts`/`draft_picks`; not done.

## File map

```
proxy.ts                         Next 16 middleware (was middleware.ts — Next 16 renamed
                                 the convention; exports `proxy`). Session refresh + redirects.
lib/supabase/{client,server,middleware}.ts   @supabase/ssr clients
lib/types/database.ts            generated via MCP generate_typescript_types — REGENERATE after schema changes
lib/draft.ts                     snake math (mirrors SQL in make_draft_pick)
lib/labels.ts                    event/status/trade labels, emoji, RPC_ERRORS code→copy map (friendlyError)
lib/actions/*.ts                 'use server' wrappers: parse FormData → rpc()/query →
                                 friendlyError → revalidatePath. Return {error?|message?} (ActionState)
components/                      HgAvatar (circular headshot, sizes xs/sm/md/lg/xl, initials
                                 fallback, plain <img> for any host), SubmitButton (useFormStatus),
                                 FormNotice, CopyButton, Poller
app/(auth)/login,signup          client pages w/ useActionState
app/(app)/layout.tsx             getUser() guard + shell
app/(app)/dashboard              my leagues
app/(app)/leagues/new,join       create (RPC) / join (RPC)
app/(app)/seasons/[seasonId]     CastManager (owner-only editing, image upload via server action)
app/(app)/leagues/[leagueId]/    layout (membership check + tabs) · page (home) · draft/
                                 (DraftRoom board) · leaderboard/ · roster/ · trades/ ·
                                 predictions/ · commissioner/ (CommissionerRoom: draft order/
                                 start, scoring entry, cast status, settings, finale)
supabase/migrations/             8 files: enums · tables(+profile trigger) · rls_helpers ·
                                 rls_policies · rpcs · views · storage · (fixes applied live are
                                 folded into these files)
supabase/seed.sql                SQL-only season+cast seed
scripts/seed.ts                  full demo seed (needs SUPABASE_SERVICE_ROLE_KEY; npm run seed)
```

UI conventions: dark "stage lighting" theme, utility classes `.card .btn-primary
.btn-secondary .btn-danger .input .label .badge` defined in `app/globals.css`.
Reality-TV copy everywhere ("Diary Room receipts", "Backdoor complete", "on the clock").
Houseguest photos always render through `HgAvatar` (never bare `next/image` — sources
are arbitrary hosts).

## Traps already hit — don't re-hit them

1. **Supabase Auth email confirmation is ON** in this project (user was told to toggle
   it off in Dashboard → Auth → Sign In / Providers → Email). Until then, fresh signups
   get "check your email" (handled in the signup action). There is NO MCP tool for auth
   config. Also GoTrue rejects some TLDs (`.test`) on signup — hence `@housedraft-demo.com`.
2. **Creating auth users via raw SQL insert** (the only path without a service key):
   you MUST also set the token columns to `''` (confirmation_token, recovery_token,
   email_change*, phone_change*, reauthentication_token) AND insert an `auth.identities`
   row (provider 'email', provider_id = user id), or password login 500s with
   "Database error querying schema". The profile trigger (`handle_new_user`) fires fine.
3. **storage.objects policies:** an unqualified `name` inside an `EXISTS (select … from
   seasons s …)` subquery binds to `s.name`, not the object path — qualify as
   `objects.name`. And uploads FAIL without a **SELECT policy** on storage.objects
   (the storage API reads the row back after insert; upsert checks for existing rows).
   Both fixes live in `supabase/migrations/20260707000007_storage.sql`.
4. **Roster interval boundaries:** close + open at the same timestamp; attribution is
   `acquired_at <= occurred_at < released_at`. Never reintroduce a gap or overlap
   (partial unique index `idx_rosters_one_owner` enforces one active owner).
5. **Inside one SQL transaction `now()` is frozen** — multi-step tests that rely on
   event-vs-trade ordering must pass explicit `p_occurred_at` values.
6. **Scraping:** parade.com (DataDome) and fandom.com block bots; **bigbrothernetwork.com
   allows plain curl with a browser UA** and its cast images are hotlinkable.
7. **`create-next-app` refuses non-empty dirs** (.claude/.mcp.json) — scaffold to a temp
   subdir and move (already done; only relevant for reference).
8. **Next 16:** `cookies()` and `params` are async (await them); `middleware.ts` is
   deprecated in favor of `proxy.ts` exporting `proxy`.
9. **`<select><option>` can't render images** — houseguest pickers stay text-only;
   avatars go next to rendered names.

## How to develop & verify

- `npm run dev` (http://localhost:3000) · `npm run lint` · `npm run build` — keep both clean.
- **Log in as a demo user in scripts/curl:** password-grant against
  `POST {URL}/auth/v1/token?grant_type=password` with the anon key as `apikey` header.
  For authed page GETs, build the SSR cookie `sb-pifypixhlqppohchqxve-auth-token` =
  `"base64-" + base64url(JSON session)` (chunk at ~3180 chars as `…-auth-token.0/.1` if long).
- **End-to-end acceptance test pattern** (already passed once): drive the REST/RPC API
  as the 4 demo users — create league → 3 joins → predictions → lock → start_draft with
  explicit order → 16 snake picks (compute position client-side) → scoring events →
  leaderboard math assert → trade propose/accept/approve → post-trade attribution assert →
  statuses + finale events + award_finale_bonuses (expect idempotency) → champion.
  Include negative checks: out-of-turn pick, non-commissioner scoring/start, post-lock
  prediction insert, anon league read. Use a THROWAWAY league and delete it after
  (commissioner DELETE on leagues cascades); revert any houseguest status changes
  (they're on the shared season).
- **After schema changes:** re-run MCP `generate_typescript_types` → overwrite
  `lib/types/database.ts`; run MCP `get_advisors` (security) — the existing WARNs about
  `authenticated`-executable SECURITY DEFINER functions are our intentional RPC design.
- DB-level flow testing without the API: `execute_sql` with
  `set_config('request.jwt.claims', '{"sub":"<uid>","role":"authenticated"}', true)`
  to impersonate users inside a DO block (RPCs check auth.uid(), not the role).

## Known limitations / candidate next steps

- Polling, not Realtime (draft room + trades).
- 1-for-1 trades only; no multi-asset packages, no counter-offers. Unclaimed leftover
  houseguests can be claimed 1-for-1 via the floating pool (commissioner gavel required).
- Attribution uses `occurred_at` (defaults to entry time) — back-entered events after a
  trade credit the current owner unless backdated.
- Single commissioner; no transfer/co-commissioner.
- No pick timer / auto-pick in the draft; no pagination on event logs (limit 25).
- Signup UX depends on the dashboard email-confirmation toggle (see trap #1).
- Storage uploads only work for season owners; the demo season is owned by demo1.
- Sandbox fake cast was replaced by the real BB28 cast (user-approved, 2026-07-07);
  there is no fake season anymore.
