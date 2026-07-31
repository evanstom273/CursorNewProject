-- Run this in Supabase → SQL Editor
-- Safe to re-run. Fixes schema + RLS for the dashboard Notes widget.

-- 1. Create table if it doesn't exist yet
create table if not exists public.notes (
	id uuid primary key default gen_random_uuid(),
	content text not null default '',
	created_at timestamptz not null default now()
);

-- 2. Add columns the app expects (won't fail if they already exist)
alter table public.notes
	add column if not exists client_id text,
	add column if not exists position integer not null default 0,
	add column if not exists updated_at timestamptz not null default now();

-- 3. If you created notes with a required user_id from an earlier guide,
--    make it optional until auth is wired up
do $$
begin
	if exists (
		select 1 from information_schema.columns
		where table_schema = 'public'
			and table_name = 'notes'
			and column_name = 'user_id'
	) then
		alter table public.notes alter column user_id drop not null;
	end if;
end $$;

create index if not exists notes_client_id_idx on public.notes (client_id);

-- 4. Replace restrictive RLS policies with dev-friendly anon access
alter table public.notes enable row level security;

drop policy if exists "Users can manage their own notes" on public.notes;
drop policy if exists "Users can manage their own layout" on public.notes;
drop policy if exists "notes_anon_all" on public.notes;

create policy "notes_anon_all"
	on public.notes
	for all
	to anon, authenticated
	using (true)
	with check (true);

-- 5. Refresh PostgREST schema cache
notify pgrst, 'reload schema';
