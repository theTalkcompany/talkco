-- Create a public avatars bucket and policies
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read access to avatars
create policy if not exists "Avatars are publicly accessible"
on storage.objects
for select
using (bucket_id = 'avatars');

-- Users can upload to their own folder (first path segment = auth.uid())
create policy if not exists "Users can upload their own avatar"
on storage.objects
for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
create policy if not exists "Users can update their own avatar"
on storage.objects
for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
create policy if not exists "Users can delete their own avatar"
on storage.objects
for delete
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);