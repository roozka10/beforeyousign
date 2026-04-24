-- User credits and plan tracking
create table if not exists public.user_credits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  credits integer not null default 0,
  plan text not null default 'pay_per_use', -- 'pay_per_use' | 'unlimited'
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Only the user can read their own row; service role handles writes from webhook
alter table public.user_credits enable row level security;

drop policy if exists "Users can view own credits" on public.user_credits;
create policy "Users can view own credits"
  on public.user_credits for select
  using (auth.uid() = user_id);

-- Function to deduct one credit when a contract is analysed
create or replace function public.deduct_credit(p_user_id uuid)
returns void
language plpgsql security definer
as $$
begin
  update public.user_credits
  set credits = credits - 1,
      updated_at = now()
  where user_id = p_user_id
    and plan = 'pay_per_use'
    and credits > 0;
end;
$$;
