-- HouseDraft: EVICTED default points -10 → -3 (forward-only).
-- Past scoring_events keep their snapshotted points; only the rule + seed change.

update public.scoring_rules
set points = -3
where event_type = 'EVICTED' and points = -10;

create or replace function public.create_league(
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
    ('HOH_WIN', 10), ('VETO_WIN', 8), ('VETO_USED', 4), ('SAVED_WITH_VETO', 4), ('SURVIVED_EVICTION', 3),
    ('NOMINATED', -3), ('REPLACEMENT_NOMINEE', -2), ('EVICTED', -3), ('MADE_JURY', 10),
    ('MADE_FINAL_5', 15), ('MADE_FINAL_3', 20), ('RUNNER_UP', 30), ('WINNER', 60),
    ('AMERICA_FAVORITE', 25), ('BLOCK_BUSTER_WIN', 8), ('TIME_CAPSULE_SELECTED', 5),
    ('TIME_CAPSULE_POWER', 3), ('TIME_CAPSULE_PUNISHMENT', -3),
    ('CORRECT_WINNER_PICK', 25), ('CORRECT_FIRST_BOOT', 15)
  ) as v(et, pts);

  return query select v_league_id, v_code;
end $$;
