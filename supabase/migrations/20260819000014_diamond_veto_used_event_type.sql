-- HouseDraft: Diamond Veto Used event enum value.
--
-- Keep enum additions in their own migration so follow-up migrations can safely
-- cast and insert the new value after this transaction commits.

alter type public.event_type add value if not exists 'DIAMOND_VETO_USED';
