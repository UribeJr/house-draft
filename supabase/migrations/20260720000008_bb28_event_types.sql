-- HouseDraft: BB28 twist event enum values.
--
-- Keep enum additions in their own migration so follow-up migrations can safely
-- cast and insert the new values after this transaction commits.

alter type public.event_type add value if not exists 'BLOCK_BUSTER_WIN';
alter type public.event_type add value if not exists 'TIME_CAPSULE_SELECTED';
alter type public.event_type add value if not exists 'TIME_CAPSULE_POWER';
alter type public.event_type add value if not exists 'TIME_CAPSULE_PUNISHMENT';
