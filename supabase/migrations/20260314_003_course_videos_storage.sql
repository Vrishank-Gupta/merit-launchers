insert into storage.buckets (id, name, public)
values ('course-videos', 'course-videos', true)
on conflict (id) do nothing;

drop policy if exists "dev public read course videos" on storage.objects;
create policy "dev public read course videos" on storage.objects
for select to anon, authenticated
using (bucket_id = 'course-videos');

drop policy if exists "dev public write course videos" on storage.objects;
create policy "dev public write course videos" on storage.objects
for insert to anon, authenticated
with check (bucket_id = 'course-videos');

drop policy if exists "dev public update course videos" on storage.objects;
create policy "dev public update course videos" on storage.objects
for update to anon, authenticated
using (bucket_id = 'course-videos')
with check (bucket_id = 'course-videos');

drop policy if exists "dev public delete course videos" on storage.objects;
create policy "dev public delete course videos" on storage.objects
for delete to anon, authenticated
using (bucket_id = 'course-videos');
