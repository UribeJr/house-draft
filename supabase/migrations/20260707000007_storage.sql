-- HouseDraft: houseguest image storage. Public read; writes limited to the
-- season owner, using the first path segment as the season id:
--   houseguest-images/{season_id}/{houseguest_id}.{ext}

insert into storage.buckets (id, name, public)
values ('houseguest-images', 'houseguest-images', true)
on conflict (id) do nothing;

-- The storage API reads the object row back after upload (and upserts check for
-- an existing row first); without a SELECT policy those reads fail RLS.
create policy "hg_images_select" on storage.objects
for select to authenticated using (bucket_id = 'houseguest-images');

create policy "hg_images_insert_season_owner" on storage.objects
for insert to authenticated with check (
  bucket_id = 'houseguest-images'
  and exists (
    select 1 from public.seasons s
    where s.id::text = (storage.foldername(objects.name))[1] and s.created_by = auth.uid()
  )
);

create policy "hg_images_update_season_owner" on storage.objects
for update to authenticated using (
  bucket_id = 'houseguest-images'
  and exists (
    select 1 from public.seasons s
    where s.id::text = (storage.foldername(objects.name))[1] and s.created_by = auth.uid()
  )
);

create policy "hg_images_delete_season_owner" on storage.objects
for delete to authenticated using (
  bucket_id = 'houseguest-images'
  and exists (
    select 1 from public.seasons s
    where s.id::text = (storage.foldername(objects.name))[1] and s.created_by = auth.uid()
  )
);
