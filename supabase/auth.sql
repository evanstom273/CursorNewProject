-- Run AFTER supabase/notes.sql once auth is enabled in your app.
-- Replaces open anon policies with per-user RLS.

alter table public.notes enable row level security;

drop policy if exists "notes_anon_all" on public.notes;
drop policy if exists "Users can manage their own notes" on public.notes;
drop policy if exists "notes_select_own" on public.notes;
drop policy if exists "notes_insert_own" on public.notes;
drop policy if exists "notes_update_own" on public.notes;
drop policy if exists "notes_delete_own" on public.notes;

create policy "notes_select_own"
	on public.notes
	for select
	to authenticated
	using (auth.uid() = user_id);

create policy "notes_insert_own"
	on public.notes
	for insert
	to authenticated
	with check (auth.uid() = user_id);

create policy "notes_update_own"
	on public.notes
	for update
	to authenticated
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

create policy "notes_delete_own"
	on public.notes
	for delete
	to authenticated
	using (auth.uid() = user_id);

notify pgrst, 'reload schema';
