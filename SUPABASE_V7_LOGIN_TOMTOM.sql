-- Planning-GJsystems v7 login en beveiligde TomTom
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 email text, first_name text, last_name text, full_name text,
 role text not null default 'user' check (role in ('admin','user')),
 is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.app_secrets (
 id integer primary key default 1 check(id=1),
 tomtom_api_key text, tomtom_enabled boolean not null default false,
 updated_at timestamptz not null default now(), updated_by uuid references auth.users(id)
);
insert into public.app_secrets(id,tomtom_enabled) values(1,false) on conflict(id) do nothing;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and is_active=true)
$$;
create or replace function public.get_tomtom_status() returns boolean language sql stable security definer set search_path=public as $$
 select coalesce((select tomtom_enabled and coalesce(length(tomtom_api_key),0)>0 from public.app_secrets where id=1),false)
$$;
create or replace function public.set_tomtom_secret(p_key text,p_enabled boolean) returns boolean language plpgsql security definer set search_path=public as $$
begin
 if not public.is_admin() then raise exception 'Geen beheerdersrechten'; end if;
 insert into public.app_secrets(id,tomtom_api_key,tomtom_enabled,updated_at,updated_by) values(1,nullif(p_key,''),p_enabled,now(),auth.uid())
 on conflict(id) do update set tomtom_api_key=excluded.tomtom_api_key,tomtom_enabled=excluded.tomtom_enabled,updated_at=now(),updated_by=auth.uid();
 return true;
end$$;
alter table public.profiles enable row level security;
alter table public.app_secrets enable row level security;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert to authenticated with check(id=auth.uid());
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated using(id=auth.uid() or public.is_admin()) with check(id=auth.uid() or public.is_admin());
revoke all on public.app_secrets from anon,authenticated;
grant execute on function public.get_tomtom_status() to authenticated;
grant execute on function public.set_tomtom_secret(text,boolean) to authenticated;
