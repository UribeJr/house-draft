import type { VariantProps } from "class-variance-authority";
import type { Database } from "@/lib/types/database";
import type { badgeVariants } from "@/components/ui/badge";

export type EventType = Database["public"]["Enums"]["event_type"];
export type HouseguestStatus = Database["public"]["Enums"]["houseguest_status"];
export type TradeStatus = Database["public"]["Enums"]["trade_status"];

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export const EVENT_LABELS: Record<EventType, string> = {
  HOH_WIN: "HOH Win",
  VETO_WIN: "Veto Win",
  VETO_USED: "Veto Used",
  SAVED_WITH_VETO: "Saved with Veto",
  SURVIVED_EVICTION: "Survived Eviction Night",
  NOMINATED: "Nomination Chair",
  REPLACEMENT_NOMINEE: "Replacement Nominee",
  EVICTED: "Evicted",
  MADE_JURY: "Made Jury",
  MADE_FINAL_5: "Made Final 5",
  MADE_FINAL_3: "Made Final 3",
  RUNNER_UP: "Runner-Up",
  WINNER: "Season Winner",
  AMERICA_FAVORITE: "America's Favorite",
  BLOCK_BUSTER_WIN: "Block Buster Win",
  TIME_CAPSULE_SELECTED: "Time Capsule Selected",
  TIME_CAPSULE_POWER: "Time Capsule Power-Up",
  TIME_CAPSULE_PUNISHMENT: "Time Capsule Punishment",
  CORRECT_WINNER_PICK: "Called the Winner",
  CORRECT_FIRST_BOOT: "Called the First Boot",
};

// The two team-level prediction bonuses attach to a member, not a houseguest.
export const MEMBER_EVENT_TYPES: EventType[] = [
  "CORRECT_WINNER_PICK",
  "CORRECT_FIRST_BOOT",
];

export const STATUS_LABELS: Record<HouseguestStatus, string> = {
  active: "In the House",
  evicted: "Evicted",
  jury: "Jury",
  finalist: "Finalist",
  winner: "Winner",
};

export const STATUS_STYLES: Record<HouseguestStatus, BadgeVariant> = {
  active: "status-active",
  evicted: "status-evicted",
  jury: "status-jury",
  finalist: "status-finalist",
  winner: "status-winner",
};

export const TRADE_STATUS_LABELS: Record<TradeStatus, string> = {
  pending: "Pending",
  accepted: "Awaiting Commissioner",
  rejected: "Rejected",
  vetoed: "Vetoed",
  approved: "Backdoor Complete",
};

export const TRADE_STATUS_STYLES: Record<TradeStatus, BadgeVariant> = {
  pending: "trade-pending",
  accepted: "trade-accepted",
  rejected: "trade-rejected",
  vetoed: "trade-vetoed",
  approved: "trade-approved",
};

/** Map raw Postgres exception messages from our RPCs to human copy. */
export const RPC_ERRORS: Record<string, string> = {
  NOT_AUTHENTICATED: "You need to be signed in for that.",
  SEASON_NOT_FOUND: "That season doesn't exist.",
  INVALID_ROSTER_SIZE: "Roster size must be between 1 and 8.",
  INVALID_CODE: "That invite code doesn't match any league. Double-check it!",
  DRAFT_STARTED: "The draft already started — this league is locked.",
  ALREADY_MEMBER: "You're already in this league.",
  TEAM_NAME_TAKEN: "That team name is taken in this league. Pick another.",
  NOT_COMMISSIONER: "Only the commissioner can do that.",
  DRAFT_ALREADY_STARTED: "The draft has already started.",
  NEED_AT_LEAST_2_TEAMS: "You need at least 2 teams to start the draft.",
  NOT_ENOUGH_HOUSEGUESTS:
    "Not enough houseguests in this season for every roster. Add more to the cast.",
  INVALID_DRAFT_ORDER: "That draft order is invalid.",
  DRAFT_NOT_ACTIVE: "The draft isn't live right now.",
  NOT_YOUR_PICK: "Hold up — you're not on the clock.",
  INVALID_HOUSEGUEST: "That houseguest isn't in this season.",
  ALREADY_DRAFTED: "Too slow — that houseguest is already off the board.",
  TRADES_DISABLED: "Trades are disabled in this league.",
  LEAGUE_NOT_ACTIVE: "Trades open once the draft is complete.",
  NOT_A_MEMBER: "You're not a member of this league.",
  NOT_YOUR_HOUSEGUEST: "You can only offer houseguests from your own roster.",
  HOUSEGUEST_UNOWNED: "Nobody owns that houseguest.",
  CANNOT_TRADE_WITH_SELF: "You can't trade with yourself.",
  TRADE_NOT_FOUND: "That trade no longer exists.",
  TRADE_NOT_PENDING: "That trade was already resolved.",
  NOT_TRADE_RECIPIENT: "Only the other side of this trade can respond.",
  TRADE_NO_LONGER_VALID:
    "A houseguest in this trade changed hands — the trade is dead.",
  APPROVAL_NOT_REQUIRED: "This league doesn't use commissioner approval.",
  TRADE_NOT_AWAITING_APPROVAL: "That trade isn't awaiting approval.",
  PROVIDE_HOUSEGUEST_OR_MEMBER: "Pick a houseguest or a team for this event.",
  INVALID_MEMBER: "That team isn't in this league.",
  NO_RULE_FOR_EVENT: "No scoring rule exists for that event type.",
  NO_WINNER_MARKED:
    "Mark a houseguest as Winner (in the cast manager) before awarding finale bonuses.",
  HOUSEGUEST_NOT_FOUND: "That houseguest doesn't exist.",
  NOT_AUTHORIZED: "You don't have permission to edit this houseguest.",
};

export function friendlyError(message: string | undefined | null): string {
  if (!message) return "Something went wrong. Try again.";
  for (const [code, copy] of Object.entries(RPC_ERRORS)) {
    if (message.includes(code)) return copy;
  }
  return message;
}
