import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  CheckTokenIcon,
  CrystalBallIcon,
  EventIcon,
  GavelIcon,
  ReceiptIcon,
  SwapArrowsIcon,
  TrophyIcon,
} from "@/components/icons";
import { EVENT_LABELS, MEMBER_EVENT_TYPES, type EventType } from "@/lib/labels";

const RULE_ORDER: EventType[] = [
  "HOH_WIN",
  "VETO_WIN",
  "VETO_USED",
  "SAVED_WITH_VETO",
  "SURVIVED_EVICTION",
  "NOMINATED",
  "REPLACEMENT_NOMINEE",
  "EVICTED",
  "MADE_JURY",
  "MADE_FINAL_5",
  "MADE_FINAL_3",
  "RUNNER_UP",
  "WINNER",
  "AMERICA_FAVORITE",
  "BLOCK_BUSTER_WIN",
  "TIME_CAPSULE_SELECTED",
  "TIME_CAPSULE_POWER",
  "TIME_CAPSULE_PUNISHMENT",
  "CORRECT_WINNER_PICK",
  "CORRECT_FIRST_BOOT",
];

type Rule = {
  event_type: EventType;
  points: number;
};

function formatPoints(points: number) {
  return points > 0 ? `+${points}` : String(points);
}

function RuleRow({ rule }: { rule: Rule }) {
  const isMemberEvent = MEMBER_EVENT_TYPES.includes(rule.event_type);

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl surface-row px-3.5 py-3 text-sm">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white">
          <EventIcon type={rule.event_type} className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{EVENT_LABELS[rule.event_type]}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {isMemberEvent ? "Team prediction bonus" : "Houseguest event"}
          </p>
        </div>
      </div>
      <span
        className={`shrink-0 font-mono text-base font-bold ${
          rule.points >= 0 ? "text-[#1fb25a]" : "text-[#f01c25]"
        }`}
      >
        {formatPoints(rule.points)}
      </span>
    </li>
  );
}

export default async function RulesPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const supabase = await createClient();

  const [{ data: league }, { data: rules }] = await Promise.all([
    supabase
      .from("leagues")
      .select("id, status, roster_size, trades_enabled, trade_approval_required, predictions_locked_at")
      .eq("id", leagueId)
      .single(),
    supabase.from("scoring_rules").select("event_type, points").eq("league_id", leagueId),
  ]);

  if (!league) notFound();

  const rulesByType = new Map((rules ?? []).map((rule) => [rule.event_type, rule as Rule]));
  const orderedRules = RULE_ORDER.map((eventType) => rulesByType.get(eventType)).filter(
    (rule): rule is Rule => Boolean(rule)
  );

  const positiveRules = orderedRules.filter((rule) => rule.points > 0);
  const penaltyRules = orderedRules.filter((rule) => rule.points < 0);
  const predictionRules = orderedRules.filter((rule) => MEMBER_EVENT_TYPES.includes(rule.event_type));
  const episodeRules = orderedRules.filter((rule) => !MEMBER_EVENT_TYPES.includes(rule.event_type));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader band="blue">League Flow</CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-700">
            <p>
              Invite code joins stay open until the draft starts. The commissioner starts
              the snake draft, then rosters score as the season airs.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge>{league.roster_size} roster spots</Badge>
              <Badge>{league.status}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader band="green">Scoring</CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-700">
            <p>
              Commissioner entries snapshot the point value shown below. Deleting an
              entry removes those points from the leaderboard.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge>
                <CheckTokenIcon className="h-3.5 w-3.5" /> {positiveRules.length} bonuses
              </Badge>
              <Badge>
                <ReceiptIcon className="h-3.5 w-3.5" /> {penaltyRules.length} penalties
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader band="pink">Trades</CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-700">
            <p>
              Trades are 1-for-1. Swap with another team, or send one of yours to claim an
              unclaimed houseguest floating in the house — your sent guest becomes the new
              floater. Accepted trades move houseguest ownership at the execution timestamp.
            </p>
            <p className="text-zinc-600">
              Unclaimed claims always need the commissioner&apos;s gavel, even when member
              trades auto-execute.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge>
                <SwapArrowsIcon className="h-3.5 w-3.5" /> {league.trades_enabled ? "On" : "Off"}
              </Badge>
              {league.trades_enabled && (
                <Badge>
                  <GavelIcon className="h-3.5 w-3.5" />{" "}
                  {league.trade_approval_required ? "Gavel required" : "Auto-executes"}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader band="yellow">Finale</CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-700">
            <p>
              Winner and first-boot predictions are team bonuses. Finale bonuses are
              awarded once, then rank 1 is crowned champion.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge>
                <CrystalBallIcon className="h-3.5 w-3.5" /> {predictionRules.length} picks
              </Badge>
              <Badge>
                <TrophyIcon className="h-3.5 w-3.5" /> Champion
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader band="orange">Scoring Table</CardHeader>
        <CardContent>
          {orderedRules.length === 0 ? (
            <p className="text-sm text-zinc-500">No scoring rules are configured for this league.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
              <ul className="grid gap-2 sm:grid-cols-2">
                {episodeRules.map((rule) => (
                  <RuleRow key={rule.event_type} rule={rule} />
                ))}
              </ul>

              <div className="space-y-4">
                <div className="rounded-xl border-2 border-black bg-white p-4 shadow-[var(--kit-shadow-soft)]">
                  <h2 className="type-board-large flex items-center gap-2">
                    <CrystalBallIcon className="h-5 w-5" /> Prediction bonuses
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {predictionRules.map((rule) => (
                      <RuleRow key={rule.event_type} rule={rule} />
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border-2 border-black bg-white p-4 shadow-[var(--kit-shadow-soft)]">
                  <h2 className="type-board-large flex items-center gap-2">
                    <ReceiptIcon className="h-5 w-5" /> Attribution
                  </h2>
                  <p className="mt-2 text-sm text-zinc-700">
                    Houseguest events credit the team that owns that houseguest at the
                    event&apos;s timestamp. Prediction bonuses attach directly to the team,
                    not a houseguest.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
