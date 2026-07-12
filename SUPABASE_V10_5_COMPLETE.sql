-- Planning-GJsystems v10.5 complete migration. Safe to run repeatedly.
begin;
create extension if not exists pgcrypto;

-- Only supported roles.
update public.profiles set role=case when lower(coalesce(role,'user'))='admin' then 'admin' else 'user' end;
-- Preserve the project owner's central administrator account during migration.
update public.profiles p set role='admin',is_active=true from auth.users u where p.id=u.id and lower(u.email)=lower('georgio_jejanan@hotmail.com');
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check(role in ('user','admin'));

create or replace function public.is_app_admin() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and coalesce(is_active,true))$$;
grant execute on function public.is_app_admin() to authenticated;
revoke execute on function public.is_app_admin() from anon;

-- Central per-user settings shared by laptop and iPhone.
create table if not exists public.user_app_settings(user_id uuid primary key references auth.users(id) on delete cascade,language text not null default 'nl' check(language in ('nl','en','de')),settings jsonb not null default '{}'::jsonb,updated_at timestamptz not null default now());
alter table public.user_app_settings enable row level security;
drop policy if exists user_app_settings_select on public.user_app_settings;create policy user_app_settings_select on public.user_app_settings for select to authenticated using(user_id=auth.uid() or public.is_app_admin());
drop policy if exists user_app_settings_write on public.user_app_settings;create policy user_app_settings_write on public.user_app_settings for all to authenticated using(user_id=auth.uid() or public.is_app_admin()) with check(user_id=auth.uid() or public.is_app_admin());
grant select,insert,update on public.user_app_settings to authenticated;

-- Add workspace owner to all currently used shared tables when present.
do $$declare t text;begin foreach t in array array['customers','planning','app_day_settings','app_absences'] loop if to_regclass('public.'||t) is not null then execute format('alter table public.%I add column if not exists user_id uuid references auth.users(id) on delete cascade',t);execute format('create index if not exists %I on public.%I(user_id)',t||'_user_id_idx',t);end if;end loop;end$$;

-- Existing unowned rows belong to the first active administrator, preserving current data.
do $$declare admin_id uuid; t text;begin select id into admin_id from public.profiles where role='admin' and coalesce(is_active,true) order by id limit 1;if admin_id is not null then foreach t in array array['customers','planning','app_day_settings','app_absences'] loop if to_regclass('public.'||t) is not null then execute format('update public.%I set user_id=$1 where user_id is null',t) using admin_id;end if;end loop;end if;end$$;

-- Automatic ownership for new rows.
create or replace function public.set_workspace_owner() returns trigger language plpgsql security definer set search_path=public as $$begin if new.user_id is null then new.user_id=auth.uid();end if;if new.user_id<>auth.uid() and not public.is_app_admin() then raise exception 'Geen toegang tot deze werkruimte';end if;return new;end$$;
do $$declare t text;begin foreach t in array array['customers','planning','app_day_settings','app_absences'] loop if to_regclass('public.'||t) is not null then execute format('drop trigger if exists set_workspace_owner on public.%I',t);execute format('create trigger set_workspace_owner before insert or update on public.%I for each row execute function public.set_workspace_owner()',t);execute format('alter table public.%I enable row level security',t);execute format('drop policy if exists workspace_select on public.%I',t);execute format('create policy workspace_select on public.%I for select to authenticated using(user_id=auth.uid() or public.is_app_admin())',t);execute format('drop policy if exists workspace_insert on public.%I',t);execute format('create policy workspace_insert on public.%I for insert to authenticated with check(user_id=auth.uid() or public.is_app_admin())',t);execute format('drop policy if exists workspace_update on public.%I',t);execute format('create policy workspace_update on public.%I for update to authenticated using(user_id=auth.uid() or public.is_app_admin()) with check(user_id=auth.uid() or public.is_app_admin())',t);execute format('drop policy if exists workspace_delete on public.%I',t);execute format('create policy workspace_delete on public.%I for delete to authenticated using(user_id=auth.uid() or public.is_app_admin())',t);end if;end loop;end$$;

-- Profile photos: one private folder per user, shared display URL in profile.
alter table public.profiles add column if not exists avatar_url text;alter table public.profiles add column if not exists updated_at timestamptz not null default now();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('profile-photos','profile-photos',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "profile photos public read" on storage.objects;create policy "profile photos public read" on storage.objects for select to authenticated using(bucket_id='profile-photos');
drop policy if exists "users manage own profile photo" on storage.objects;create policy "users manage own profile photo" on storage.objects for all to authenticated using(bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text);

-- Support threads, messages and read state.
create table if not exists public.contact_threads(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,sender_name text,sender_email text,subject text not null,status text not null default 'nieuw' check(status in ('nieuw','in_behandeling','beantwoord','gesloten')),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),closed_at timestamptz);
create table if not exists public.contact_messages(id uuid primary key default gen_random_uuid(),thread_id uuid not null references public.contact_threads(id) on delete cascade,sender_id uuid not null references auth.users(id) on delete cascade,sender_role text not null check(sender_role in ('user','admin')),message text not null,created_at timestamptz not null default now());
create table if not exists public.contact_thread_reads(thread_id uuid references public.contact_threads(id) on delete cascade,user_id uuid references auth.users(id) on delete cascade,reader_role text not null check(reader_role in ('user','admin')),last_read_at timestamptz not null default now(),primary key(thread_id,user_id,reader_role));
create index if not exists contact_threads_user_idx on public.contact_threads(user_id,updated_at desc);create index if not exists contact_messages_thread_idx on public.contact_messages(thread_id,created_at);
alter table public.contact_threads enable row level security;alter table public.contact_messages enable row level security;alter table public.contact_thread_reads enable row level security;
drop policy if exists contact_threads_access on public.contact_threads;create policy contact_threads_access on public.contact_threads for all to authenticated using(user_id=auth.uid() or public.is_app_admin()) with check(user_id=auth.uid() or public.is_app_admin());
drop policy if exists contact_messages_access on public.contact_messages;create policy contact_messages_access on public.contact_messages for select to authenticated using(exists(select 1 from public.contact_threads t where t.id=thread_id and (t.user_id=auth.uid() or public.is_app_admin())));
drop policy if exists contact_messages_insert on public.contact_messages;create policy contact_messages_insert on public.contact_messages for insert to authenticated with check(sender_id=auth.uid() and exists(select 1 from public.contact_threads t where t.id=thread_id and (t.user_id=auth.uid() or public.is_app_admin())));
drop policy if exists contact_reads_access on public.contact_thread_reads;create policy contact_reads_access on public.contact_thread_reads for all to authenticated using(user_id=auth.uid() or public.is_app_admin()) with check(user_id=auth.uid() or public.is_app_admin());
grant select,insert,update,delete on public.contact_threads,public.contact_messages,public.contact_thread_reads to authenticated;
create or replace function public.create_contact_thread(p_subject text,p_message text) returns uuid language plpgsql security definer set search_path=public as $$declare v_id uuid:=gen_random_uuid();p public.profiles%rowtype;begin if auth.uid() is null then raise exception 'Niet ingelogd';end if;if char_length(trim(coalesce(p_message,'')))<3 then raise exception 'Bericht is te kort';end if;select * into p from public.profiles where id=auth.uid();insert into public.contact_threads(id,user_id,sender_name,sender_email,subject) values(v_id,auth.uid(),coalesce(nullif(p.full_name,''),p.email),p.email,coalesce(nullif(trim(p_subject),''),'Overig'));insert into public.contact_messages(thread_id,sender_id,sender_role,message) values(v_id,auth.uid(),'user',trim(p_message));return v_id;end$$;grant execute on function public.create_contact_thread(text,text) to authenticated;

do $$begin alter publication supabase_realtime add table public.user_app_settings;exception when duplicate_object then null;end$$;do $$begin alter publication supabase_realtime add table public.contact_threads;exception when duplicate_object then null;end$$;do $$begin alter publication supabase_realtime add table public.contact_messages;exception when duplicate_object then null;end$$;
commit;
