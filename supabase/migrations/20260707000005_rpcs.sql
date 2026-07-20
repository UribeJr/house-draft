-- HouseDraft: SECURITY DEFINER RPCs. All multi-row/stateful writes happen here,
-- inside single transactions, with explicit auth checks (definer bypasses RLS).

-------------------------------------------------------------------------------
-- create_league: league + commissioner membership + pending draft + default rules
-------------------------------------------------------------------------------
create function public.create_league(
  p_name text,
  p_season_id uuid,
  p_roster_size int,
  p_trades_enabled boolean,
  p_trade_approval_required boolean,
  p_team_name text
) returns table (league_id uuid, invite_code text)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_league_id uuid;
  v_code text;
  v_alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_i int;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not exists (select 1 from seasons where id = p_season_id) then
    raise exception 'SEASON_NOT_FOUND';
  end if;
  if p_roster_size is null or p_roster_size not between 1 and 8 then
    raise exception 'INVALID_ROSTER_SIZE';
  end if;

  loop
    v_code := '';
    for v_i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from leagues l where l.invite_code = v_code);
  end loop;

  insert into leagues (name, season_id, commissioner_id, roster_size, trades_enabled, trade_approval_required, invite_code)
  values (trim(p_name), p_season_id, v_uid, p_roster_size, p_trades_enabled, p_trade_approval_required, v_code)
  returning id into v_league_id;

  insert into league_members (league_id, user_id, team_name)
  values (v_league_id, v_uid, trim(p_team_name));

  insert into drafts (league_id) values (v_league_id);

  insert into scoring_rules (league_id, event_type, points)
  select v_league_id, v.et::event_type, v.pts
  from (values
    ('HOH_WIN', 10), ('VETO_WIN', 8), ('VETO_USED', 4), ('SURVIVED_EVICTION', 3),
    ('NOMINATED', -3), ('REPLACEMENT_NOMINEE', -2), ('EVICTED', -10), ('MADE_JURY', 10),
    ('MADE_FINAL_5', 15), ('MADE_FINAL_3', 20), ('RUNNER_UP', 30), ('WINNER', 60),
    ('AMERICA_FAVORITE', 25), ('BLOCK_BUSTER_WIN', 8), ('TIME_CAPSULE_SELECTED', 5),
    ('TIME_CAPSULE_POWER', 3), ('TIME_CAPSULE_PUNISHMENT', -3),
    ('CORRECT_WINNER_PICK', 25), ('CORRECT_FIRST_BOOT', 15)
  ) as v(et, pts);

  return query select v_league_id, v_code;
end $$;

-------------------------------------------------------------------------------
-- join_league_with_code: definer lookup (non-members cannot SELECT the league)
-------------------------------------------------------------------------------
create function public.join_league_with_code(p_invite_code text, p_team_name text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_league leagues%rowtype;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select * into v_league from leagues where invite_code = upper(trim(p_invite_code));
  if not found then raise exception 'INVALID_CODE'; end if;
  if exists (select 1 from drafts where league_id = v_league.id and status <> 'pending') then
    raise exception 'DRAFT_STARTED';
  end if;
  if exists (select 1 from league_members where league_id = v_league.id and user_id = v_uid) then
    raise exception 'ALREADY_MEMBER';
  end if;
  if exists (select 1 from league_members where league_id = v_league.id and lower(team_name) = lower(trim(p_team_name))) then
    raise exception 'TEAM_NAME_TAKEN';
  end if;

  insert into league_members (league_id, user_id, team_name)
  values (v_league.id, v_uid, trim(p_team_name));

  return v_league.id;
end $$;

-------------------------------------------------------------------------------
-- start_draft: set order (random or explicit), activate draft
-------------------------------------------------------------------------------
create function public.start_draft(p_league_id uuid, p_member_order uuid[] default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_league leagues%rowtype;
  v_draft drafts%rowtype;
  v_team_count int;
  v_available int;
  v_order uuid[];
  v_i int;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into v_league from leagues where id = p_league_id;
  if not found or v_league.commissioner_id <> v_uid then raise exception 'NOT_COMMISSIONER'; end if;

  select * into v_draft from drafts where league_id = p_league_id for update;
  if v_draft.status <> 'pending' then raise exception 'DRAFT_ALREADY_STARTED'; end if;

  select count(*) into v_team_count from league_members where league_id = p_league_id;
  if v_team_count < 2 then raise exception 'NEED_AT_LEAST_2_TEAMS'; end if;

  select count(*) into v_available from houseguests where season_id = v_league.season_id;
  if v_available < v_league.roster_size * v_team_count then
    raise exception 'NOT_ENOUGH_HOUSEGUESTS';
  end if;

  if p_member_order is null then
    select array_agg(id order by random()) into v_order
    from league_members where league_id = p_league_id;
  else
    v_order := p_member_order;
    if array_length(v_order, 1) <> v_team_count
       or exists (
         select 1 from unnest(v_order) o(id)
         where not exists (select 1 from league_members m where m.id = o.id and m.league_id = p_league_id)
       )
       or (select count(distinct o) from unnest(v_order) o) <> v_team_count then
      raise exception 'INVALID_DRAFT_ORDER';
    end if;
  end if;

  for v_i in 1..v_team_count loop
    update league_members set draft_position = v_i where id = v_order[v_i];
  end loop;

  update drafts set status = 'active', total_picks = v_league.roster_size * v_team_count, started_at = now()
  where id = v_draft.id;
  update leagues set status = 'drafting' where id = p_league_id;
end $$;

-------------------------------------------------------------------------------
-- make_draft_pick: FOR UPDATE on drafts row serializes concurrent picks
-------------------------------------------------------------------------------
create function public.make_draft_pick(p_league_id uuid, p_houseguest_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_league leagues%rowtype;
  v_draft drafts%rowtype;
  v_team_count int;
  v_round int;
  v_pos int;
  v_member league_members%rowtype;
  v_complete boolean;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into v_league from leagues where id = p_league_id;
  if not found then raise exception 'LEAGUE_NOT_FOUND'; end if;

  select * into v_draft from drafts where league_id = p_league_id for update;
  if v_draft.status <> 'active' then raise exception 'DRAFT_NOT_ACTIVE'; end if;

  select count(*) into v_team_count from league_members where league_id = p_league_id;
  v_round := ceil(v_draft.current_pick::numeric / v_team_count);
  if v_round % 2 = 1 then
    v_pos := ((v_draft.current_pick - 1) % v_team_count) + 1;
  else
    v_pos := v_team_count - ((v_draft.current_pick - 1) % v_team_count);
  end if;

  select * into v_member from league_members
  where league_id = p_league_id and draft_position = v_pos;
  if v_member.user_id <> v_uid then raise exception 'NOT_YOUR_PICK'; end if;

  if not exists (select 1 from houseguests where id = p_houseguest_id and season_id = v_league.season_id) then
    raise exception 'INVALID_HOUSEGUEST';
  end if;
  if exists (select 1 from draft_picks where draft_id = v_draft.id and houseguest_id = p_houseguest_id) then
    raise exception 'ALREADY_DRAFTED';
  end if;

  insert into draft_picks (draft_id, league_id, league_member_id, houseguest_id, pick_number, round)
  values (v_draft.id, p_league_id, v_member.id, p_houseguest_id, v_draft.current_pick, v_round);

  insert into rosters (league_id, league_member_id, houseguest_id, acquisition_type)
  values (p_league_id, v_member.id, p_houseguest_id, 'draft');

  v_complete := v_draft.current_pick >= v_draft.total_picks;
  if v_complete then
    update drafts set status = 'completed', completed_at = now() where id = v_draft.id;
    update leagues set status = 'active' where id = p_league_id;
  else
    update drafts set current_pick = current_pick + 1 where id = v_draft.id;
  end if;

  return jsonb_build_object('pick_number', v_draft.current_pick, 'draft_complete', v_complete);
end $$;

-------------------------------------------------------------------------------
-- Trades
-------------------------------------------------------------------------------
create function public.propose_trade(p_league_id uuid, p_my_houseguest_id uuid, p_their_houseguest_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_league leagues%rowtype;
  v_me league_members%rowtype;
  v_my_owner uuid;
  v_their_owner uuid;
  v_trade_id uuid;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into v_league from leagues where id = p_league_id;
  if not found then raise exception 'LEAGUE_NOT_FOUND'; end if;
  if not v_league.trades_enabled then raise exception 'TRADES_DISABLED'; end if;
  if v_league.status <> 'active' then raise exception 'LEAGUE_NOT_ACTIVE'; end if;

  select * into v_me from league_members where league_id = p_league_id and user_id = v_uid;
  if not found then raise exception 'NOT_A_MEMBER'; end if;

  select league_member_id into v_my_owner from rosters
  where league_id = p_league_id and houseguest_id = p_my_houseguest_id and released_at is null;
  if v_my_owner is null or v_my_owner <> v_me.id then raise exception 'NOT_YOUR_HOUSEGUEST'; end if;

  select league_member_id into v_their_owner from rosters
  where league_id = p_league_id and houseguest_id = p_their_houseguest_id and released_at is null;
  if v_their_owner is null then raise exception 'HOUSEGUEST_UNOWNED'; end if;
  if v_their_owner = v_me.id then raise exception 'CANNOT_TRADE_WITH_SELF'; end if;

  insert into trades (league_id, proposer_member_id, recipient_member_id)
  values (p_league_id, v_me.id, v_their_owner)
  returning id into v_trade_id;

  insert into trade_items (trade_id, from_member_id, houseguest_id) values
    (v_trade_id, v_me.id, p_my_houseguest_id),
    (v_trade_id, v_their_owner, p_their_houseguest_id);

  return v_trade_id;
end $$;

-- Internal: swap ownership intervals. Not granted to any role.
-- Intervals close and open at the same instant (half-open [acquired_at, released_at))
-- so no event timestamp can fall into a gap between owners.
create function public._execute_trade(p_trade_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_trade trades%rowtype;
  v_item trade_items%rowtype;
  v_to_member uuid;
  v_now timestamptz := now();
begin
  select * into v_trade from trades where id = p_trade_id;
  for v_item in select * from trade_items where trade_id = p_trade_id loop
    update rosters set released_at = v_now
    where league_id = v_trade.league_id
      and league_member_id = v_item.from_member_id
      and houseguest_id = v_item.houseguest_id
      and released_at is null;

    v_to_member := case when v_item.from_member_id = v_trade.proposer_member_id
                        then v_trade.recipient_member_id
                        else v_trade.proposer_member_id end;

    insert into rosters (league_id, league_member_id, houseguest_id, acquired_at, acquisition_type, trade_id)
    values (v_trade.league_id, v_to_member, v_item.houseguest_id, v_now, 'trade', p_trade_id);
  end loop;
end $$;

-- Internal: both items still owned by their offering side?
create function public._trade_still_valid(p_trade_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from trade_items ti
    join trades t on t.id = ti.trade_id
    where ti.trade_id = p_trade_id
      and not exists (
        select 1 from rosters r
        where r.league_id = t.league_id
          and r.houseguest_id = ti.houseguest_id
          and r.league_member_id = ti.from_member_id
          and r.released_at is null
      )
  );
$$;

create function public.respond_to_trade(p_trade_id uuid, p_accept boolean)
returns public.trade_status
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_trade trades%rowtype;
  v_league leagues%rowtype;
  v_recipient league_members%rowtype;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into v_trade from trades where id = p_trade_id for update;
  if not found then raise exception 'TRADE_NOT_FOUND'; end if;
  if v_trade.status <> 'pending' then raise exception 'TRADE_NOT_PENDING'; end if;

  select * into v_recipient from league_members where id = v_trade.recipient_member_id;
  if v_recipient.user_id <> v_uid then raise exception 'NOT_TRADE_RECIPIENT'; end if;

  if not p_accept then
    update trades set status = 'rejected', resolved_at = now() where id = p_trade_id;
    return 'rejected';
  end if;

  if not public._trade_still_valid(p_trade_id) then
    update trades set status = 'rejected', resolved_at = now() where id = p_trade_id;
    raise exception 'TRADE_NO_LONGER_VALID';
  end if;

  select * into v_league from leagues where id = v_trade.league_id;
  if v_league.trade_approval_required then
    update trades set status = 'accepted' where id = p_trade_id;
    return 'accepted';
  end if;

  perform public._execute_trade(p_trade_id);
  update trades set status = 'accepted', resolved_at = now() where id = p_trade_id;
  return 'accepted';
end $$;

create function public.approve_trade(p_trade_id uuid, p_approve boolean)
returns public.trade_status
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_trade trades%rowtype;
  v_league leagues%rowtype;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into v_trade from trades where id = p_trade_id for update;
  if not found then raise exception 'TRADE_NOT_FOUND'; end if;

  select * into v_league from leagues where id = v_trade.league_id;
  if v_league.commissioner_id <> v_uid then raise exception 'NOT_COMMISSIONER'; end if;
  if not v_league.trade_approval_required then raise exception 'APPROVAL_NOT_REQUIRED'; end if;
  if v_trade.status <> 'accepted' then raise exception 'TRADE_NOT_AWAITING_APPROVAL'; end if;

  if not p_approve then
    update trades set status = 'vetoed', resolved_at = now() where id = p_trade_id;
    return 'vetoed';
  end if;

  if not public._trade_still_valid(p_trade_id) then
    update trades set status = 'vetoed', resolved_at = now() where id = p_trade_id;
    raise exception 'TRADE_NO_LONGER_VALID';
  end if;

  perform public._execute_trade(p_trade_id);
  update trades set status = 'approved', resolved_at = now() where id = p_trade_id;
  return 'approved';
end $$;

-------------------------------------------------------------------------------
-- Scoring
-------------------------------------------------------------------------------
create function public.add_scoring_event(
  p_league_id uuid,
  p_event_type public.event_type,
  p_week int,
  p_houseguest_id uuid default null,
  p_league_member_id uuid default null,
  p_episode int default null,
  p_notes text default null,
  p_occurred_at timestamptz default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_league leagues%rowtype;
  v_points int;
  v_event_id uuid;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into v_league from leagues where id = p_league_id;
  if not found or v_league.commissioner_id <> v_uid then raise exception 'NOT_COMMISSIONER'; end if;

  if num_nonnulls(p_houseguest_id, p_league_member_id) <> 1 then
    raise exception 'PROVIDE_HOUSEGUEST_OR_MEMBER';
  end if;
  if p_houseguest_id is not null and not exists (
    select 1 from houseguests where id = p_houseguest_id and season_id = v_league.season_id
  ) then raise exception 'INVALID_HOUSEGUEST'; end if;
  if p_league_member_id is not null and not exists (
    select 1 from league_members where id = p_league_member_id and league_id = p_league_id
  ) then raise exception 'INVALID_MEMBER'; end if;

  select points into v_points from scoring_rules
  where league_id = p_league_id and event_type = p_event_type;
  if v_points is null then raise exception 'NO_RULE_FOR_EVENT'; end if;

  insert into scoring_events (league_id, houseguest_id, league_member_id, event_type, points, week, episode, notes, occurred_at, created_by)
  values (p_league_id, p_houseguest_id, p_league_member_id, p_event_type, v_points, p_week, p_episode, p_notes, coalesce(p_occurred_at, now()), v_uid)
  returning id into v_event_id;

  return v_event_id;
end $$;

-------------------------------------------------------------------------------
-- Predictions lock + houseguest status (any commissioner using the season)
-------------------------------------------------------------------------------
create function public.lock_predictions(p_league_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from leagues where id = p_league_id and commissioner_id = auth.uid()) then
    raise exception 'NOT_COMMISSIONER';
  end if;
  update leagues set predictions_locked_at = coalesce(predictions_locked_at, now())
  where id = p_league_id;
end $$;

-- Houseguest status/placement reflect real show facts, so any commissioner of a
-- league using that season (or the season owner) may update them.
create function public.update_houseguest_status(
  p_houseguest_id uuid,
  p_status public.houseguest_status,
  p_placement int default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_season_id uuid;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select season_id into v_season_id from houseguests where id = p_houseguest_id;
  if not found then raise exception 'HOUSEGUEST_NOT_FOUND'; end if;
  if not exists (select 1 from seasons where id = v_season_id and created_by = v_uid)
     and not exists (select 1 from leagues where season_id = v_season_id and commissioner_id = v_uid) then
    raise exception 'NOT_AUTHORIZED';
  end if;
  update houseguests set status = p_status, placement = p_placement where id = p_houseguest_id;
end $$;

-------------------------------------------------------------------------------
-- Finale: award prediction bonuses, complete the league
-------------------------------------------------------------------------------
create function public.award_finale_bonuses(p_league_id uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_league leagues%rowtype;
  v_winner_id uuid;
  v_first_boot_id uuid;
  v_cast_count int;
  v_week int;
  v_awarded int := 0;
  v_pred record;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into v_league from leagues where id = p_league_id;
  if not found or v_league.commissioner_id <> v_uid then raise exception 'NOT_COMMISSIONER'; end if;

  select id into v_winner_id from houseguests
  where season_id = v_league.season_id and status = 'winner' limit 1;
  if v_winner_id is null then raise exception 'NO_WINNER_MARKED'; end if;

  select count(*) into v_cast_count from houseguests where season_id = v_league.season_id;
  select id into v_first_boot_id from houseguests
  where season_id = v_league.season_id and placement = v_cast_count limit 1;

  select coalesce(max(week), 0) into v_week from scoring_events where league_id = p_league_id;

  for v_pred in
    select p.league_member_id, p.predicted_winner_id, p.predicted_first_boot_id
    from predictions p where p.league_id = p_league_id
  loop
    if v_pred.predicted_winner_id = v_winner_id then
      insert into scoring_events (league_id, league_member_id, event_type, points, week, notes, created_by)
      select p_league_id, v_pred.league_member_id, 'CORRECT_WINNER_PICK', sr.points, v_week, 'Called the winner before the season started', v_uid
      from scoring_rules sr where sr.league_id = p_league_id and sr.event_type = 'CORRECT_WINNER_PICK'
      on conflict do nothing;
      if found then v_awarded := v_awarded + 1; end if;
    end if;
    if v_first_boot_id is not null and v_pred.predicted_first_boot_id = v_first_boot_id then
      insert into scoring_events (league_id, league_member_id, event_type, points, week, notes, created_by)
      select p_league_id, v_pred.league_member_id, 'CORRECT_FIRST_BOOT', sr.points, v_week, 'Called the first boot', v_uid
      from scoring_rules sr where sr.league_id = p_league_id and sr.event_type = 'CORRECT_FIRST_BOOT'
      on conflict do nothing;
      if found then v_awarded := v_awarded + 1; end if;
    end if;
  end loop;

  update leagues set status = 'completed' where id = p_league_id;
  return v_awarded;
end $$;

-------------------------------------------------------------------------------
-- Grants: public API surface to authenticated only; internals to no one
-------------------------------------------------------------------------------
revoke execute on function
  public.create_league(text, uuid, int, boolean, boolean, text),
  public.join_league_with_code(text, text),
  public.start_draft(uuid, uuid[]),
  public.make_draft_pick(uuid, uuid),
  public.propose_trade(uuid, uuid, uuid),
  public.respond_to_trade(uuid, boolean),
  public.approve_trade(uuid, boolean),
  public.add_scoring_event(uuid, public.event_type, int, uuid, uuid, int, text, timestamptz),
  public.lock_predictions(uuid),
  public.update_houseguest_status(uuid, public.houseguest_status, int),
  public.award_finale_bonuses(uuid)
from anon, public;

grant execute on function
  public.create_league(text, uuid, int, boolean, boolean, text),
  public.join_league_with_code(text, text),
  public.start_draft(uuid, uuid[]),
  public.make_draft_pick(uuid, uuid),
  public.propose_trade(uuid, uuid, uuid),
  public.respond_to_trade(uuid, boolean),
  public.approve_trade(uuid, boolean),
  public.add_scoring_event(uuid, public.event_type, int, uuid, uuid, int, text, timestamptz),
  public.lock_predictions(uuid),
  public.update_houseguest_status(uuid, public.houseguest_status, int),
  public.award_finale_bonuses(uuid)
to authenticated;

revoke execute on function public._execute_trade(uuid), public._trade_still_valid(uuid)
from anon, public, authenticated;
