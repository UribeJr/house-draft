-- HouseDraft: extensions and enums
create extension if not exists pgcrypto;

create type public.houseguest_status as enum ('active','evicted','jury','finalist','winner');
create type public.league_status     as enum ('setup','drafting','active','completed');
create type public.draft_status      as enum ('pending','active','completed');
create type public.trade_status      as enum ('pending','accepted','rejected','vetoed','approved');
create type public.acquisition_type  as enum ('draft','trade');
create type public.event_type as enum (
  'HOH_WIN','VETO_WIN','VETO_USED','SURVIVED_EVICTION','NOMINATED',
  'REPLACEMENT_NOMINEE','EVICTED','MADE_JURY','MADE_FINAL_5','MADE_FINAL_3',
  'RUNNER_UP','WINNER','AMERICA_FAVORITE','CORRECT_WINNER_PICK','CORRECT_FIRST_BOOT'
);
