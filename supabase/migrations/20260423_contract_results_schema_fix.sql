-- Bring production contract_results schema in sync with app writes.
-- Safe to run multiple times.

create table if not exists public.contract_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  file_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.contract_results
  add column if not exists overall_score integer,
  add column if not exists clarity integer,
  add column if not exists fairness integer,
  add column if not exists risk_level text,
  add column if not exists key_issues text[] default '{}',
  add column if not exists simple_explanation text,
  add column if not exists user_location text,
  add column if not exists document_type text,
  add column if not exists main_concern text,
  add column if not exists contract_text text;

create index if not exists idx_contract_results_user_created_at
  on public.contract_results(user_id, created_at desc);

alter table public.contract_results enable row level security;

drop policy if exists "Users can read own contract results" on public.contract_results;
create policy "Users can read own contract results"
  on public.contract_results for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own contract results" on public.contract_results;
create policy "Users can insert own contract results"
  on public.contract_results for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own contract results" on public.contract_results;
create policy "Users can delete own contract results"
  on public.contract_results for delete
  using (auth.uid() = user_id);
