-- HouseDraft: trade for unowned leftover houseguests (floating pool).
-- Nullable recipient/from_member means "the house". Existing rows unchanged.

alter table public.trades
  alter column recipient_member_id drop not null;

alter table public.trade_items
  alter column from_member_id drop not null;

create unique index idx_trade_items_one_pool_item
  on public.trade_items (trade_id)
  where from_member_id is null;

-------------------------------------------------------------------------------
-- propose_trade: member swap OR claim from unowned pool (always awaits gavel)
-------------------------------------------------------------------------------
create or replace function public.propose_trade(
  p_league_id uuid,
  p_my_houseguest_id uuid,
  p_their_houseguest_id uuid
)
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

  if p_my_houseguest_id = p_their_houseguest_id then
    raise exception 'CANNOT_TRADE_WITH_SELF';
  end if;

  select league_member_id into v_my_owner from rosters
  where league_id = p_league_id and houseguest_id = p_my_houseguest_id and released_at is null;
  if v_my_owner is null or v_my_owner <> v_me.id then raise exception 'NOT_YOUR_HOUSEGUEST'; end if;

  select league_member_id into v_their_owner from rosters
  where league_id = p_league_id and houseguest_id = p_their_houseguest_id and released_at is null;

  if v_their_owner is null then
    -- Claim an unowned leftover from the floating pool.
    if not exists (
      select 1 from houseguests hg
      where hg.id = p_their_houseguest_id and hg.season_id = v_league.season_id
    ) then
      raise exception 'INVALID_HOUSEGUEST';
    end if;

    insert into trades (league_id, proposer_member_id, recipient_member_id, status)
    values (p_league_id, v_me.id, null, 'accepted')
    returning id into v_trade_id;

    insert into trade_items (trade_id, from_member_id, houseguest_id) values
      (v_trade_id, v_me.id, p_my_houseguest_id),
      (v_trade_id, null, p_their_houseguest_id);

    return v_trade_id;
  end if;

  if v_their_owner = v_me.id then raise exception 'CANNOT_TRADE_WITH_SELF'; end if;

  insert into trades (league_id, proposer_member_id, recipient_member_id)
  values (p_league_id, v_me.id, v_their_owner)
  returning id into v_trade_id;

  insert into trade_items (trade_id, from_member_id, houseguest_id) values
    (v_trade_id, v_me.id, p_my_houseguest_id),
    (v_trade_id, v_their_owner, p_their_houseguest_id);

  return v_trade_id;
end $$;

-------------------------------------------------------------------------------
-- _execute_trade: member swap OR drop-to-pool / claim-from-pool
-------------------------------------------------------------------------------
create or replace function public._execute_trade(p_trade_id uuid)
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
    if v_item.from_member_id is not null then
      update rosters set released_at = v_now
      where league_id = v_trade.league_id
        and league_member_id = v_item.from_member_id
        and houseguest_id = v_item.houseguest_id
        and released_at is null;
    end if;

    v_to_member := case
      when v_item.from_member_id = v_trade.proposer_member_id then v_trade.recipient_member_id
      else v_trade.proposer_member_id
    end;

    if v_to_member is not null then
      insert into rosters (league_id, league_member_id, houseguest_id, acquired_at, acquisition_type, trade_id)
      values (v_trade.league_id, v_to_member, v_item.houseguest_id, v_now, 'trade', p_trade_id);
    end if;
  end loop;
end $$;

-------------------------------------------------------------------------------
-- _trade_still_valid: owned items still with offerer; pool items still unowned
-------------------------------------------------------------------------------
create or replace function public._trade_still_valid(p_trade_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from trade_items ti
    join trades t on t.id = ti.trade_id
    where ti.trade_id = p_trade_id
      and (
        (
          ti.from_member_id is not null
          and not exists (
            select 1 from rosters r
            where r.league_id = t.league_id
              and r.houseguest_id = ti.houseguest_id
              and r.league_member_id = ti.from_member_id
              and r.released_at is null
          )
        )
        or (
          ti.from_member_id is null
          and exists (
            select 1 from rosters r
            where r.league_id = t.league_id
              and r.houseguest_id = ti.houseguest_id
              and r.released_at is null
          )
        )
      )
  );
$$;

-------------------------------------------------------------------------------
-- approve_trade: pool claims always need gavel even when approval is off
-------------------------------------------------------------------------------
create or replace function public.approve_trade(p_trade_id uuid, p_approve boolean)
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
  if not v_league.trade_approval_required and v_trade.recipient_member_id is not null then
    raise exception 'APPROVAL_NOT_REQUIRED';
  end if;
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
