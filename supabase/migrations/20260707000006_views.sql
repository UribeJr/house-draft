-- HouseDraft: computed scoring views. security_invoker so caller RLS applies.

-- Attribute every event to a member: team bonuses directly; houseguest events via
-- the ownership interval containing occurred_at. Events on unowned houseguests
-- attribute to nobody and simply don't score.
create view public.member_scoring_events
with (security_invoker = on) as
select
  se.id, se.league_id, se.houseguest_id, se.event_type, se.points, se.week,
  se.episode, se.notes, se.occurred_at, se.created_at,
  coalesce(se.league_member_id, r.league_member_id) as attributed_member_id
from public.scoring_events se
left join public.rosters r
  on se.houseguest_id is not null
 and r.league_id = se.league_id
 and r.houseguest_id = se.houseguest_id
 and r.acquired_at <= se.occurred_at
 and (r.released_at is null or se.occurred_at < r.released_at);

create view public.league_leaderboard
with (security_invoker = on) as
select
  lm.league_id,
  lm.id as league_member_id,
  lm.team_name,
  lm.user_id,
  p.username,
  coalesce(sum(mse.points), 0)::int as total_points,
  rank() over (
    partition by lm.league_id
    order by coalesce(sum(mse.points), 0) desc
  )::int as rank
from public.league_members lm
join public.profiles p on p.id = lm.user_id
left join public.member_scoring_events mse on mse.attributed_member_id = lm.id
group by lm.league_id, lm.id, lm.team_name, lm.user_id, p.username;

create view public.weekly_scores
with (security_invoker = on) as
select
  league_id,
  attributed_member_id as league_member_id,
  week,
  sum(points)::int as points
from public.member_scoring_events
where attributed_member_id is not null
group by league_id, attributed_member_id, week;
