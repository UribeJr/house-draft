# HouseDraft — Manual Launch Testing Guide

A step-by-step walkthrough for testing every feature by hand, in the browser,
using the seeded demo accounts. Check items off as you go. Budget ~30–40 minutes
for a full pass.

There's also an automated regression script (`npm run test:e2e`) that drives the
same flows against the API and asserts on the numbers — run it first as a fast
sanity check, then use this guide for everything a script can't see: layout,
copy, loading/error states, and whether it actually *feels* right.

```bash
npm run test:e2e     # ~15s, exercises draft/scoring/trades/finale + security checks
npm run dev           # http://localhost:3000
```



## Demo accounts


| Email                       | Password          | Role                                    |
| --------------------------- | ----------------- | --------------------------------------- |
| `demo1@housedraft-demo.com` | `housedraft-demo` | Commissioner of "The Backyard Alliance" |
| `demo2@housedraft-demo.com` | `housedraft-demo` | Member ("The Floater Boaters")          |
| `demo3@housedraft-demo.com` | `housedraft-demo` | Member ("Backdoor Bandits")             |
| `demo4@housedraft-demo.com` | `housedraft-demo` | Member ("Jury Management LLC")          |


Open 4 separate browser profiles or incognito windows — one per account — so you
can act as all 4 teams at once without constantly logging in/out.

**Heads up:** "The Backyard Alliance" already has a draft in progress (pick 2 of
16 — demo1/"Nomination Nation" made pick 1, "The Floater Boaters" is on the
clock). That's real state from earlier use, not a bug. For the full walkthrough
below, **create a brand-new league** ("HD Launch Test" or similar) against the
"Big Brother 28" season so you get a clean pre-draft state — don't use The
Backyard Alliance for steps that assume nothing's happened yet. Feel free to
also poke at The Backyard Alliance separately to confirm mid-draft state renders
correctly (see §4.6).

---



## 1. Auth

- [ ] **Sign up** a brand-new account (any email) at `/signup`. If you see
  ```
  "check your email," that's expected — email confirmation is still ON in
  Supabase (Dashboard → Auth → Sign In / Providers → Email → toggle off for
  instant demo signups). Using the existing demo accounts sidesteps this.
  ```
- [ ] **Log in** as `demo1` — lands on `/dashboard`.
- [ ] Visit `/dashboard` in a fresh **incognito tab with no session** → redirected
  ```
  to `/login?next=%2Fdashboard`.
  ```
- [ ] **Log out** (top-right button) → redirected to `/login`.
- [ ] Try logging in with a wrong password → friendly error, not a raw exception.



## 2. Dashboard

- [ ] As demo1: dashboard lists "The Backyard Alliance" as a card, shows
  ```
  "Commissioner" badge, correct status pill (should read something like
  "Draft LIVE").
  ```
- [ ] "Create League" and "Join with code" buttons both visible and reachable.



## 3. Create a league + season (do this as demo1)

- [ ] `/leagues/new` — since a season already exists, you go straight to the
  ```
  league form (no "create a season" prompt). Fill in: name "HD Launch Test",
  season "Big Brother 28", roster size 4, team name "Launch Testers",
  trades on, approval **off** (test the no-approval path here; The Backyard
  Alliance already covers the approval-required path).
  ```
- [ ] Submit → redirected to the new league's home page. Note the **invite code**
  ```
  shown in the "Invite friends" card.
  ```
- [ ] Open `/seasons/<id>` for Big Brother 28 (link from the commissioner room,
  ```
  or navigate directly) — confirm all **16 real houseguests** render with
  **circular headshot photos** (not initials placeholders), correct ages/
  hometowns/occupations (spot check: Rick Devens, Angela Murray, Chuk Anyanwu).
  ```
- [ ] As a non-owner account (demo2), open the same season page — cast is
  ```
  visible read-only, no Edit/Delete/Add buttons.
  ```



## 4. Join + draft (as demo2, demo3, demo4, then commissioner)

- [ ] `/leagues/join` as demo2 — enter the invite code + team name "Squad 2".
  ```
  Redirects into the league.
  ```
- [ ] Repeat for demo3 ("Squad 3") and demo4 ("Squad 4").
- [ ] Try joining again with the same code as demo2 → friendly "already a
  ```
  member" error, not a crash.
  ```
- [ ] Try a bogus invite code → friendly "doesn't match any league" error.
- [ ] As demo1: **Predictions** tab — pick a winner + first boot, save. Do the
  ```
  same as demo2/3/4 with different picks.
  ```
- [ ] As a non-commissioner (demo2), confirm you do **not** see a "🎛️
  ```
  Commissioner Room" tab or link.
  ```
- [ ] As demo1: **Commissioner Room** → lock predictions. Refresh the
  ```
  Predictions tab as any user — everyone's picks are now visible in a table
  (previously each user only saw their own).
  ```
- [ ] Try to change a prediction after lock (demo3) → should fail / no save
  ```
  option shown.
  ```
- [ ] As demo1: **Commissioner Room → Draft Controls** — reorder teams with the
  ```
  ↑/↓ arrows, then **🎲 Randomize & start** instead (either is fine, just
  exercise the control). Confirm it lands on the draft room.
  ```



### 4.1 Draft room — do the full 16-pick draft

- [ ] Draft room shows: draft board grid, available houseguests list (16, then
  ```
  shrinking), on-the-clock banner naming the right team, per-team roster
  panels at the bottom.
  ```
- [ ] As the team **not** on the clock, confirm you see no "Draft" buttons next
  ```
  to houseguests (only the on-the-clock team can pick).
  ```
- [ ] Make all 16 picks, rotating through the 4 browser windows as each team
  ```
  comes on the clock. Watch the **on-the-clock banner** update and the
  **board grid** fill in after each pick (poll refresh is ~2.5s — wait a
  moment or refresh manually).
  ```
- [ ] Confirm snake order: round 1 goes 1→2→3→4, round 2 reverses 4→3→2→1, etc.
- [ ] After the 16th pick: "✅ Draft complete" banner appears, league status
  ```
  flips to active, all 4 team roster panels show 4 houseguests each with no
  empty slots.
  ```



### 4.2 Scoring (as demo1, Commissioner Room)

- [ ] Score an **HOH_WIN** for a houseguest on team 1's roster, week 1 — confirm
  ```
  the points field auto-fills to **+10** the moment you pick the event type.
  ```
- [ ] Score a **NOMINATED** (auto −3) and an **EVICTED** (auto −10) for a
  ```
  different houseguest.
  ```
- [ ] Add a note on one event ("Backdoored at the veto meeting") and confirm it
  ```
  shows in the receipts log.
  ```
- [ ] Go to **Leaderboard** tab — totals match what you just entered, weekly
  ```
  column (Wk 1) shows the same numbers, "📼 Diary Room Receipts" lists every
  event with the right emoji + houseguest **photo**.
  ```
- [ ] Back in Commissioner Room → "Recent Entries" → delete one event (✕) →
  ```
  confirm the leaderboard total drops accordingly on refresh.
  ```



### 4.3 Roster & league home

- [ ] `/leagues/<id>/roster` as demo2 — shows only *your* 4 houseguests, correct
  ```
  per-houseguest point breakdown, total matches the leaderboard.
  ```
- [ ] League home page — leaderboard preview (top 4), "My Team" mini-list,
  ```
  recent receipts, invite code with working **Copy** button, and status
  panel described correctly ("Draft complete," predictions locked/open, etc.).
  ```



### 4.4 Trades

- [ ] As demo2: **Trades** tab → propose a 1-for-1 (your houseguest for one on
  ```
  another team). Since this league has approval **off**, this is the
  instant-execute path.
  ```
- [ ] As the recipient, **Accept** → trade should execute immediately (status
  ```
  "Backdoor Complete"), ownership swaps — verify on both teams' roster pages.
  ```
- [ ] Propose a second trade, this time **Reject** it as the recipient — status
  ```
  shows "Rejected," no ownership change.
  ```
- [ ] Score an event on the newly-traded houseguest — confirm points land on
  ```
  the *new* owner's total, not the original drafter (this is the trickiest
  part of the scoring model — worth double-checking).
  ```



### 4.5 Finale

- [ ] Commissioner Room → **Cast Status**: mark one houseguest "Winner"
  ```
  (placement 1), another "Evicted" (placement 16 — the highest placement =
  first boot).
  ```
- [ ] Score `WINNER` and `RUNNER_UP` events for finale points.
- [ ] Click **🎬 Award prediction bonuses & crown the champion**. Confirm the
  ```
  message reports how many bonuses were awarded, and re-running the button
  shows 0 (idempotent — no double-awarding).
  ```
- [ ] League home + Leaderboard now show a **🏆 champion banner** naming the
  ```
  winning team. League status badge reads "Season complete."
  ```



### 4.6 Spot-check the in-progress demo league

- [ ] Log in as demo2 (whose turn it is) on **The Backyard Alliance** →
  ```
  `/leagues/f170c310-cc7c-40d0-a2ac-b70140d7bf86/draft` — confirm the
  on-the-clock banner correctly identifies "The Floater Boaters" and demo2
  can make pick 2 while the other 3 accounts cannot.
  ```



## 5. Empty / loading / error states

- [ ] Brand-new account with zero leagues → dashboard shows the "The house is
  ```
  empty 🛋️" empty state, not a blank page.
  ```
- [ ] A season with zero houseguests (if you make one) → cast manager shows the
  ```
  "No cast yet 🎬" empty state.
  ```
- [ ] A league with zero trades → Trades tab shows "No trades yet" copy.
- [ ] Force a slow network (DevTools → Network → Slow 3G) and navigate between
  ```
  tabs — loading spinner ("Cutting to the Diary Room…") appears, not a
  flash of blank content.
  ```
- [ ] Visit a league ID that doesn't exist, or one you're not a member of →
  ```
  "You've been evicted (or never moved in) 🔒" not-found page, not a 500.
  ```



## 6. Mobile / responsive

- [ ] DevTools device toolbar (iPhone/Android width) — check: dashboard cards
  ```
  stack to 1 column, league tab bar scrolls horizontally without wrapping
  oddly, draft board table scrolls horizontally inside its own container
  (page itself doesn't scroll sideways), forms and buttons stay tappable.
  ```



## 7. Security spot checks (defense in depth — `test:e2e` already covers these at the API level)

- [ ] As demo2 (non-commissioner), confirm there's simply no UI path to start a
  ```
  draft, edit league settings, or score an event — commissioner-only
  controls aren't just hidden, they should also 403/no-op if hit directly
  (already verified by the automated script; this is just confirming the
  UI doesn't expose them either).
  ```
- [ ] Log out, then try pasting a league URL directly into the address bar →
  ```
  redirected to login, not shown a flash of league content first.
  ```

---



## Launch gate

- [ ] `npm run test:e2e` passes (34/34)
- [ ] `npm run build` passes with no errors
- [ ] All sections above checked off in at least one full pass
- [ ] Supabase Dashboard → Auth → Email confirmation setting matches your
  ```
  intended launch behavior (off = instant signup, on = users must click a
  confirmation email)
  ```
- [ ] `.env.local` values (URL + anon key only) are set as env vars on the
  ```
  Vercel project — **not** the service-role key
  ```

