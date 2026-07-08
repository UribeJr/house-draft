# 🏠 HouseDraft

**Draft the house. Win eviction night.**

HouseDraft is a fantasy-league web app for Big Brother-style reality competition
seasons. Create a league with friends, snake-draft the cast, earn points as the
commissioner scores each episode (HOH wins, vetoes, the Nomination Chair,
blindside evictions…), swap players with backdoor trades, and crown a league
champion on finale night.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS + Supabase**
(Auth, Postgres, Storage). Deployable on Vercel.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in your Supabase values (see below)
npm run dev                  # http://localhost:3000
```

> This repo may already contain a working `.env.local` pointing at the
> project's Supabase instance — in that case just `npm install && npm run dev`.

## Environment variables

| Variable | Where it's used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | app (client + server) | Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | app (client + server) | The **publishable/anon** key. Safe to expose — RLS is the security boundary. |
| `SUPABASE_SERVICE_ROLE_KEY` | `scripts/seed.ts` **only** | Never imported by app code, never shipped to the client, never needed on Vercel. |

## Supabase setup (new project)

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the migrations in order — either with the CLI
   (`supabase link && supabase db push`) or by pasting each file from
   [supabase/migrations/](supabase/migrations/) into the SQL editor:
   1. `…_extensions_enums.sql` — enums (statuses, the 15 event types)
   2. `…_tables.sql` — all 13 tables + auto-profile trigger
   3. `…_rls_helpers.sql` — `SECURITY DEFINER` helpers (`is_league_member`, …)
   4. `…_rls_policies.sql` — RLS on every table
   5. `…_rpcs.sql` — atomic game logic (`create_league`, `make_draft_pick`, trades, scoring, finale)
   6. `…_views.sql` — `league_leaderboard`, `member_scoring_events`, `weekly_scores`
   7. `…_storage.sql` — public `houseguest-images` bucket + owner-only write policies
3. **Auth → Sign In / Providers → Email → disable “Confirm email.”**
   HouseDraft sends no emails; with confirmation on, new signups have to click a
   confirmation link that (on the default SMTP) is heavily rate-limited. The
   signup form handles either mode, but instant signup is the intended flow.
4. (Optional) Seed demo data — see below.

## Seed the demo

```bash
# put SUPABASE_SERVICE_ROLE_KEY in .env.local first
npm run seed
```

Creates:

- **“Big Brother 28”** — the real BB28 cast (16 houseguests, including Survivor's
  Rick Devens and BB26's Angela Murray) with official headshots. The seed
  hotlinks the [Big Brother Network cast gallery](https://bigbrothernetwork.com/big-brother-28-cast/);
  the production database re-hosts these photos in the `houseguest-images`
  Storage bucket.
- 4 demo accounts, password **`housedraft-demo`**:
  `demo1@housedraft-demo.com` … `demo4@housedraft-demo.com`
- **“The Backyard Alliance”** — a 4-team league (roster 4, trades on,
  commissioner approval on) created through the real RPCs. `demo1` is the
  commissioner.

`supabase/seed.sql` is a SQL-only fallback that seeds just the season + cast.

## Demo flow (5 minutes)

1. Log in as `demo1@housedraft-demo.com` / `housedraft-demo` → open **The Backyard Alliance**.
2. **Predictions** tab — pick a winner + first boot, then lock predictions (commissioner box).
3. **Commissioner Room** → Draft Controls → reorder teams or **🎲 Randomize & start**.
4. **Draft** tab — draft as demo1; log in as demo2–4 in other browsers/profiles
   to make their picks (the room polls, so everyone sees picks live). 16 picks = draft complete.
5. **Commissioner Room** → Score an Event — add an HOH win, a veto, a nomination,
   an eviction. Points auto-fill from the league's scoring rules.
6. **Leaderboard** — watch totals and weekly columns update. Every entry shows in
   the 📼 Diary Room Receipts log.
7. **Trades** — as demo2, propose a 1-for-1; as the other side, accept; as demo1,
   approve. “Backdoor complete.” Points earned *after* the trade follow the new owner.
8. Finale: in the Commissioner Room mark the winner (+placements), score
   `WINNER` / `RUNNER_UP` / `AMERICA_FAVORITE`, then
   **🎬 Award prediction bonuses & crown the champion** → champion banner on the
   league home + leaderboard.

## Vercel deployment

1. Push this repo to GitHub and import it in Vercel (framework auto-detects Next.js).
2. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   Do **not** add the service-role key.
3. Deploy. No other configuration needed (no image-domain config — houseguest
   photos render with plain `<img>`).

## Architecture notes

- **Auth**: `@supabase/ssr` — browser client, server client, and a `proxy.ts`
  (Next 16 middleware) that refreshes sessions and redirects signed-out users.
  League pages also re-check membership server-side; RLS is the real boundary.
- **All game mutations are Postgres RPCs** (`SECURITY DEFINER`, self-authorizing):
  draft picks take a row lock so concurrent picks can't double-fire; trades
  re-validate ownership at execution time; scoring snapshots the rule's points.
- **Leaderboard is never stored.** `rosters` rows are immutable ownership
  intervals (`acquired_at`/`released_at`); the `league_leaderboard` /
  `member_scoring_events` views join `scoring_events` to whoever owned the
  houseguest **at the moment the event occurred**. Deleting a mis-entered event
  instantly corrects the standings.
- **Draft room liveness**: 2.5s polling (`router.refresh()`), zero infra. The
  upgrade path is Supabase Realtime on `drafts`/`draft_picks`.

## Known limitations

- **Polling, not websockets** — the draft room refreshes every ~2.5s.
- **1-for-1 trades only**; no multi-player packages or draft-pick trading.
- **Point attribution uses the event's `occurred_at`** (defaults to entry time).
  If the commissioner back-enters last week's events *after* a trade executes,
  those points go to the current owner — backdate `occurred_at` (or enter events
  weekly) to avoid it.
- **Single commissioner** per league; no co-commissioners or transfer.
- **Houseguest status is season-global**: any commissioner of a league using a
  season can update statuses/placements (they're facts of the show), and two
  leagues can share one season.
- **No email notifications, no payments** (by design).
- The `.test`-style demo emails are fake — Supabase's signup endpoint rejects
  some reserved TLDs, so the seed uses `@housedraft-demo.com` via the admin API.

## Project map

```
supabase/migrations/   schema, RLS, RPCs, views, storage (source of truth)
scripts/seed.ts        demo season + users + league (service role, local only)
lib/supabase/          @supabase/ssr clients (browser / server / middleware)
lib/actions/           server actions — thin wrappers over the RPCs
lib/draft.ts           snake-draft math (mirrors the SQL)
app/(auth)/            login, signup
app/(app)/dashboard    my leagues
app/(app)/seasons/     season + cast manager (photos upload to Storage)
app/(app)/leagues/[id] home · draft · leaderboard · roster · trades ·
                       predictions · commissioner room
```
