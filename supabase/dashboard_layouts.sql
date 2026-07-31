-- Dashboard layout sync (instances + per-breakpoint layouts per user)
-- Run in Supabase SQL Editor after auth is enabled.

create table if not exists public.dashboard_layouts (
	user_id uuid primary key references auth.users(id) on delete cascade,
	instances jsonb not null default '[]'::jsonb,
	layouts jsonb not null default '{}'::jsonb,
	updated_at timestamptz not null default now()
);

alter table public.dashboard_layouts enable row level security;

drop policy if exists "dashboard_layouts_select_own" on public.dashboard_layouts;
drop policy if exists "dashboard_layouts_insert_own" on public.dashboard_layouts;
drop policy if exists "dashboard_layouts_update_own" on public.dashboard_layouts;
drop policy if exists "dashboard_layouts_delete_own" on public.dashboard_layouts;

create policy "dashboard_layouts_select_own"
	on public.dashboard_layouts
	for select
	to authenticated
	using (auth.uid() = user_id);

create policy "dashboard_layouts_insert_own"
	on public.dashboard_layouts
	for insert
	to authenticated
	with check (auth.uid() = user_id);

create policy "dashboard_layouts_update_own"
	on public.dashboard_layouts
	for update
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

create policy "dashboard_layouts_delete_own"
	on public.dashboard_layouts
	for delete
	to authenticated
	using (auth.uid() = user_id);

-- Enable realtime so other devices pick up layout changes immediately
do $$
begin
	alter publication supabase_realtime add table dashboard_layouts;
exception
	when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
