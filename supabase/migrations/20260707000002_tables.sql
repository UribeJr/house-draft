-- HouseDraft: core tables

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null unique check (char_length(username) between 3 and 24),
  avatar_url text,
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_base text;
  v_name text;
  v_n int := 0;
begin
  v_base := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(new.email, '@', 1)
  );
  v_base := regexp_replace(lower(v_base), '[^a-z0-9_]', '', 'g');
  if char_length(v_base) < 3 then v_base := 'player' || substr(new.id::text, 1, 4); end if;
  v_base := substr(v_base, 1, 20);
  v_name := v_base;
  while exists (select 1 from profiles where username = v_name) loop
    v_n := v_n + 1;
    v_name := v_base || v_n::text;
  end loop;
  insert into profiles (id, username) values (new.id, v_name);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- only the auth trigger ever invokes this; keep it out of the REST RPC surface
revoke execute on function public.handle_new_user() from anon, authenticated, public;

create table public.seasons (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 80),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.houseguests (
  id         uuid primary key default gen_random_uuid(),
  season_id  uuid not null references public.seasons(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  image_url  text,
  age        int check (age between 18 and 99),
  hometown   text,
  occupation text,
  status     public.houseguest_status not null default 'active',
  placement  int check (placement >= 1),
  created_at timestamptz not null default now(),
  unique (season_id, name)
);
create index idx_houseguests_season on public.houseguests(season_id);

create table public.leagues (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null check (char_length(name) between 2 and 60),
  season_id               uuid not null references public.seasons(id),
  commissioner_id         uuid not null references public.profiles(id),
  roster_size             int  not null check (roster_size between 1 and 8),
  draft_type              text not null default 'snake' check (draft_type = 'snake'),
  trades_enabled          boolean not null default true,
  trade_approval_required boolean not null default false,
  invite_code             text not null unique,
  status                  public.league_status not null default 'setup',
  predictions_locked_at   timestamptz,
  created_at              timestamptz not null default now()
);

create table public.league_members (
  id             uuid primary key default gen_random_uuid(),
  league_id      uuid not null references public.leagues(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  team_name      text not null check (char_length(team_name) between 2 and 32),
  draft_position int,
  joined_at      timestamptz not null default now(),
  unique (league_id, user_id),
  unique (league_id, team_name)
);
create unique index idx_members_draft_pos on public.league_members(league_id, draft_position)
  where draft_position is not null;
create index idx_members_user on public.league_members(user_id);

create table public.drafts (
  id           uuid primary key default gen_random_uuid(),
  league_id    uuid not null unique references public.leagues(id) on delete cascade,
  status       public.draft_status not null default 'pending',
  current_pick int not null default 1,
  total_picks  int,
  started_at   timestamptz,
  completed_at timestamptz
);

create table public.draft_picks (
  id               uuid primary key default gen_random_uuid(),
  draft_id         uuid not null references public.drafts(id) on delete cascade,
  league_id        uuid not null references public.leagues(id) on delete cascade,
  league_member_id uuid not null references public.league_members(id) on delete cascade,
  houseguest_id    uuid not null references public.houseguests(id),
  pick_number      int not null check (pick_number >= 1),
  round            int not null check (round >= 1),
  created_at       timestamptz not null default now(),
  unique (draft_id, pick_number),
  unique (draft_id, houseguest_id)
);
create index idx_picks_league on public.draft_picks(league_id);

create table public.trades (
  id                  uuid primary key default gen_random_uuid(),
  league_id           uuid not null references public.leagues(id) on delete cascade,
  proposer_member_id  uuid not null references public.league_members(id) on delete cascade,
  recipient_member_id uuid not null references public.league_members(id) on delete cascade,
  status              public.trade_status not null default 'pending',
  resolved_at         timestamptz,
  created_at          timestamptz not null default now(),
  check (proposer_member_id <> recipient_member_id)
);
create index idx_trades_league on public.trades(league_id);

create table public.trade_items (
  id             uuid primary key default gen_random_uuid(),
  trade_id       uuid not null references public.trades(id) on delete cascade,
  from_member_id uuid not null references public.league_members(id) on delete cascade,
  houseguest_id  uuid not null references public.houseguests(id),
  unique (trade_id, from_member_id)
);

-- Ownership intervals: rows are never deleted; a trade closes one interval and opens another.
create table public.rosters (
  id               uuid primary key default gen_random_uuid(),
  league_id        uuid not null references public.leagues(id) on delete cascade,
  league_member_id uuid not null references public.league_members(id) on delete cascade,
  houseguest_id    uuid not null references public.houseguests(id),
  acquired_at      timestamptz not null default now(),
  released_at      timestamptz,
  acquisition_type public.acquisition_type not null,
  trade_id         uuid references public.trades(id),
  check (released_at is null or released_at > acquired_at)
);
create unique index idx_rosters_one_owner on public.rosters(league_id, houseguest_id)
  where released_at is null;
create index idx_rosters_member_active on public.rosters(league_member_id) where released_at is null;
create index idx_rosters_hg on public.rosters(league_id, houseguest_id);

create table public.scoring_rules (
  id         uuid primary key default gen_random_uuid(),
  league_id  uuid not null references public.leagues(id) on delete cascade,
  event_type public.event_type not null,
  points     int not null,
  unique (league_id, event_type)
);

create table public.scoring_events (
  id               uuid primary key default gen_random_uuid(),
  league_id        uuid not null references public.leagues(id) on delete cascade,
  houseguest_id    uuid references public.houseguests(id),
  league_member_id uuid references public.league_members(id) on delete cascade,
  event_type       public.event_type not null,
  points           int not null,
  week             int not null check (week >= 0),
  episode          int,
  notes            text,
  occurred_at      timestamptz not null default now(),
  created_by       uuid not null references public.profiles(id),
  created_at       timestamptz not null default now(),
  check (num_nonnulls(houseguest_id, league_member_id) = 1)
);
create index idx_events_league_week on public.scoring_events(league_id, week);
create index idx_events_hg on public.scoring_events(league_id, houseguest_id);
create unique index idx_events_member_bonus_once
  on public.scoring_events(league_id, league_member_id, event_type)
  where league_member_id is not null;

create table public.predictions (
  id                      uuid primary key default gen_random_uuid(),
  league_id               uuid not null references public.leagues(id) on delete cascade,
  league_member_id        uuid not null unique references public.league_members(id) on delete cascade,
  predicted_winner_id     uuid references public.houseguests(id),
  predicted_first_boot_id uuid references public.houseguests(id),
  updated_at              timestamptz not null default now()
);
