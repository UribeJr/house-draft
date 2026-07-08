-- HouseDraft: SECURITY DEFINER helpers (bypass RLS internally to avoid policy recursion)

create function public.is_league_member(p_league_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from league_members
    where league_id = p_league_id and user_id = auth.uid()
  );
$$;

create function public.is_league_commissioner(p_league_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from leagues
    where id = p_league_id and commissioner_id = auth.uid()
  );
$$;

create function public.predictions_locked(p_league_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select predictions_locked_at is not null from leagues where id = p_league_id), false);
$$;

revoke execute on function public.is_league_member(uuid) from anon, public;
revoke execute on function public.is_league_commissioner(uuid) from anon, public;
revoke execute on function public.predictions_locked(uuid) from anon, public;
grant execute on function public.is_league_member(uuid) to authenticated;
grant execute on function public.is_league_commissioner(uuid) to authenticated;
grant execute on function public.predictions_locked(uuid) to authenticated;
