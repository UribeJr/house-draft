# I Built Fantasy Football for Big Brother — Snake Drafts, Weekly Scoring, and Trades That Don’t Rewrite History

Every season my group chat turns into a spreadsheet war.

Who got HOH. Who flubbed the veto. Who just got backdoored. Someone always “has the points” in a Google Sheet that nobody trusts by week 4.

So I built **HouseDraft** — fantasy leagues for Big Brother–style seasons. Invite friends, snake-draft the cast, score every twist as it happens, trade for a backdoor, and crown a league champion on finale night.

- Live demo: https://house-draft.vercel.app
- GitHub: https://github.com/UribeJr/house-draft

![Snake draft room](https://raw.githubusercontent.com/UribeJr/house-draft/main/docs/readme/draft-room.png)

## What I built

The full season loop in one app:

- Invite → snake draft → weekly scoring → trades → predictions → finale
- Live draft room with snake order and “on the clock” clarity
- Commissioner scoring for HOH, veto, noms, evictions, and season twists
- Leaderboard + **Diary Room Receipts** so every point has a paper trail
- 1-for-1 trades (optional commissioner approval) that don’t rewrite history

**[▶ Try the live demo →](https://house-draft.vercel.app)**

![My leagues dashboard](https://raw.githubusercontent.com/UribeJr/house-draft/main/docs/readme/dashboard.png)

## The sticky idea

> Points follow whoever owned the houseguest *when the event happened*.

Alice drafts X, banks 20 points, then trades X to Bob. Alice keeps the 20. Bob only scores from that moment forward.

Rosters are ownership intervals — not static lists — so the leaderboard stays honest through the chaos of trades.

![League leaderboard](https://raw.githubusercontent.com/UribeJr/house-draft/main/docs/readme/leaderboard.png)

![Score an Event](https://raw.githubusercontent.com/UribeJr/house-draft/main/docs/readme/commissioner-score.png)

## Built with

Next.js 16 + React 19 + TypeScript, Supabase Auth/Postgres (RLS + RPCs for draft/scoring integrity), Tailwind v4, deployed on Vercel.

Deep dive + architecture: [README](https://github.com/UribeJr/house-draft#readme)

{% github UribeJr/house-draft %}

## What’s next

Realtime draft room (polling works today), richer trade packages, and “you’re on the clock” digests.

---

Not affiliated with any network or franchise — fan-made fantasy for people who already argue about the veto.

Demo: https://house-draft.vercel.app  
Repo: https://github.com/UribeJr/house-draft

What reality season would *you* turn into a fantasy league first?

---

**Suggested DEV tags:** `showdev` `webdev` `nextjs` `supabase`  
**Cover image:** `docs/readme/draft-room.png`
