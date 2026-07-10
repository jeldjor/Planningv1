-- Eenmalig uitvoeren in Supabase > SQL Editor.
-- Maakt opslag voor bezoekfoto's en geeft de huidige webapp toegang.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('visit-photos', 'visit-photos', true, 10485760, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.visit_photos enable row level security;

-- Tijdelijke policies voor de huidige versie zonder volledige gebruikerslogin.
-- Zodra Auth overal is ingebouwd, kunnen deze worden aangescherpt naar authenticated gebruikers.
drop policy if exists "visit photos read" on public.visit_photos;
create policy "visit photos read" on public.visit_photos for select using (true);
drop policy if exists "visit photos insert" on public.visit_photos;
create policy "visit photos insert" on public.visit_photos for insert with check (true);

drop policy if exists "visit photos storage read" on storage.objects;
create policy "visit photos storage read" on storage.objects for select using (bucket_id = 'visit-photos');
drop policy if exists "visit photos storage insert" on storage.objects;
create policy "visit photos storage insert" on storage.objects for insert with check (bucket_id = 'visit-photos');
