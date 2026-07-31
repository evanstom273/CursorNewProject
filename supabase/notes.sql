-- Run this in Supabase → SQL Editor
-- Notes are scoped per browser via client_id until auth is added.

create table if not exists public.notes (
	id uuid primary key default gen_random_uuid(),
	client_id text not null,
	content text not null default '',
	position integer not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists notes_client_id_idx on public.notes (client_id);

alter table public.notes enable row level security;

-- Dev policy: open access. Replace with auth.uid() policies before production.
create policy "notes_anon_all"
	on public.notes
	for all
	to anon
	using (true)
	with check (true);
