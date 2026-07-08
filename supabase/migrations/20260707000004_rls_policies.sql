-- HouseDraft: enable RLS + policies.
-- Tables with no INSERT/UPDATE/DELETE policies mutate only through SECURITY DEFINER RPCs.

alter table public.profiles       enable row level security;
alter table public.seasons        enable row level security;
alter table public.houseguests    enable row level security;
alter table public.leagues        enable row level security;
alter table public.league_members enable row level security;
alter table public.drafts         enable row level security;
alter table public.draft_picks    enable row level security;
alter table public.trades         enable row level security;
alter table public.trade_items    enable row level security;
alter table public.rosters        enable row level security;
alter table public.scoring_rules  enable row level security;
alter table public.scoring_events enable row level security;
alter table public.predictions    enable row level security;

-- profiles
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- seasons: readable by all signed-in users; writable by their creator
create policy "seasons_select" on public.seasons for select to authenticated using (true);
create policy "seasons_insert_own" on public.seasons for insert to authenticated
  with check (created_by = auth.uid());
create policy "seasons_update_own" on public.seasons for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "seasons_delete_own" on public.seasons for delete to authenticated
  using (created_by = auth.uid());

-- houseguests: writable by the season owner
create policy "houseguests_select" on public.houseguests for select to authenticated using (true);
create policy "houseguests_insert_owner" on public.houseguests for insert to authenticated
  with check (exists (select 1 from public.seasons s where s.id = season_id and s.created_by = auth.uid()));
create policy "houseguests_update_owner" on public.houseguests for update to authenticated
  using (exists (select 1 from public.seasons s where s.id = season_id and s.created_by = auth.uid()))
  with check (exists (select 1 from public.seasons s where s.id = season_id and s.created_by = auth.uid()));
create policy "houseguests_delete_owner" on public.houseguests for delete to authenticated
  using (exists (select 1 from public.seasons s where s.id = season_id and s.created_by = auth.uid()));

-- leagues
create policy "leagues_select_member" on public.leagues for select to authenticated
  using (commissioner_id = auth.uid() or public.is_league_member(id));
create policy "leagues_update_commish" on public.leagues for update to authenticated
  using (commissioner_id = auth.uid()) with check (commissioner_id = auth.uid());
create policy "leagues_delete_commish" on public.leagues for delete to authenticated
  using (commissioner_id = auth.uid());

-- league_members (user_id check is non-recursive; helper is definer so no recursion)
create policy "members_select" on public.league_members for select to authenticated
  using (user_id = auth.uid() or public.is_league_member(league_id));

-- drafts / draft_picks / rosters: read-only to members, mutated via RPCs
create policy "drafts_select" on public.drafts for select to authenticated
  using (public.is_league_member(league_id));
create policy "picks_select" on public.draft_picks for select to authenticated
  using (public.is_league_member(league_id));
create policy "rosters_select" on public.rosters for select to authenticated
  using (public.is_league_member(league_id));

-- scoring_rules: members read, commissioner edits point values
create policy "rules_select" on public.scoring_rules for select to authenticated
  using (public.is_league_member(league_id));
create policy "rules_update_commish" on public.scoring_rules for update to authenticated
  using (public.is_league_commissioner(league_id))
  with check (public.is_league_commissioner(league_id));

-- scoring_events: members read; commissioner can delete (undo); inserts via RPC
create policy "events_select" on public.scoring_events for select to authenticated
  using (public.is_league_member(league_id));
create policy "events_delete_commish" on public.scoring_events for delete to authenticated
  using (public.is_league_commissioner(league_id));

-- trades / trade_items: members read; mutations via RPCs
create policy "trades_select" on public.trades for select to authenticated
  using (public.is_league_member(league_id));
create policy "trade_items_select" on public.trade_items for select to authenticated
  using (exists (select 1 from public.trades t where t.id = trade_id and public.is_league_member(t.league_id)));

-- predictions: own row always; league-visible after lock; editable before lock
create policy "predictions_select" on public.predictions for select to authenticated
  using (
    league_member_id in (select id from public.league_members where user_id = auth.uid())
    or (public.is_league_member(league_id) and public.predictions_locked(league_id))
  );
create policy "predictions_insert_own" on public.predictions for insert to authenticated
  with check (
    league_member_id in (select id from public.league_members where user_id = auth.uid())
    and public.is_league_member(league_id)
    and not public.predictions_locked(league_id)
  );
create policy "predictions_update_own" on public.predictions for update to authenticated
  using (
    league_member_id in (select id from public.league_members where user_id = auth.uid())
    and not public.predictions_locked(league_id)
  )
  with check (
    league_member_id in (select id from public.league_members where user_id = auth.uid())
    and not public.predictions_locked(league_id)
  );
