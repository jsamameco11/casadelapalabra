-- Casa de la Palabra — storage buckets (spec #76).
-- All buckets are public-read (content is meant to be publicly viewable)
-- but writes are restricted to editors/admins via storage.objects policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('casa-site-assets', 'casa-site-assets', true, 10485760, array['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('casa-bible-assets', 'casa-bible-assets', true, 10485760, array['image/png','image/jpeg','image/webp']),
  ('casa-studies', 'casa-studies', true, 20971520, array['image/png','image/jpeg','image/webp','application/pdf']),
  ('casa-videos', 'casa-videos', true, 20971520, array['image/png','image/jpeg','image/webp']),
  ('casa-podcasts', 'casa-podcasts', true, 52428800, array['audio/mpeg','audio/mp4','audio/wav','image/png','image/jpeg']),
  ('casa-courses', 'casa-courses', true, 52428800, array['image/png','image/jpeg','image/webp','application/pdf','video/mp4']),
  ('casa-conferences', 'casa-conferences', true, 20971520, array['image/png','image/jpeg','image/webp']),
  ('casa-games', 'casa-games', true, 10485760, array['image/png','image/jpeg','image/webp','audio/mpeg']),
  ('casa-avatars', 'casa-avatars', true, 5242880, array['image/png','image/jpeg','image/webp']),
  ('casa-badges', 'casa-badges', true, 5242880, array['image/png','image/svg+xml','image/webp'])
on conflict (id) do nothing;

create policy "casa_storage_public_read" on storage.objects
  for select using (bucket_id in (
    'casa-site-assets','casa-bible-assets','casa-studies','casa-videos','casa-podcasts',
    'casa-courses','casa-conferences','casa-games','casa-avatars','casa-badges'
  ));

create policy "casa_storage_editor_write" on storage.objects
  for insert with check (
    bucket_id in ('casa-site-assets','casa-bible-assets','casa-studies','casa-videos','casa-podcasts','casa-courses','casa-conferences','casa-games','casa-badges')
    and casa_is_editor()
  );

create policy "casa_storage_editor_update" on storage.objects
  for update using (
    bucket_id in ('casa-site-assets','casa-bible-assets','casa-studies','casa-videos','casa-podcasts','casa-courses','casa-conferences','casa-games','casa-badges')
    and casa_is_editor()
  );

create policy "casa_storage_editor_delete" on storage.objects
  for delete using (
    bucket_id in ('casa-site-assets','casa-bible-assets','casa-studies','casa-videos','casa-podcasts','casa-courses','casa-conferences','casa-games','casa-badges')
    and casa_is_editor()
  );

-- Avatars: any authenticated user manages their own (path convention: `${user_id}/...`).
create policy "casa_storage_avatars_owner_write" on storage.objects
  for insert with check (bucket_id = 'casa-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "casa_storage_avatars_owner_update" on storage.objects
  for update using (bucket_id = 'casa-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "casa_storage_avatars_owner_delete" on storage.objects
  for delete using (bucket_id = 'casa-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
