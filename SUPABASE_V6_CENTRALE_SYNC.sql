-- Planning-GJsystems v6.0: centrale daginstellingen en afwezigheden
create table if not exists public.app_day_settings (
  datum date primary key,
  vertrektijd time,
  pauze_actief boolean default true,
  updated_at timestamptz default now()
);
create table if not exists public.app_absences (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'Overig',
  start_date date not null,
  end_date date not null,
  start_time time,
  end_time time,
  note text default '',
  updated_at timestamptz default now()
);
alter table public.app_day_settings enable row level security;
alter table public.app_absences enable row level security;
drop policy if exists "app_day_settings_all" on public.app_day_settings;
create policy "app_day_settings_all" on public.app_day_settings for all using (true) with check (true);
drop policy if exists "app_absences_all" on public.app_absences;
create policy "app_absences_all" on public.app_absences for all using (true) with check (true);
-- Nodig voor tweerichtingssync van planningtijden.
alter table public.planning add column if not exists updated_at timestamptz default now();
