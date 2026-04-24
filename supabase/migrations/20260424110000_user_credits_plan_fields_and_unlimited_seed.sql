-- Add missing columns referenced by webhook/runtime code.
alter table public.user_credits
  add column if not exists stripe_customer_id text,
  add column if not exists plan_started_at timestamptz;

-- Give this account unlimited access for testing/admin usage.
insert into public.user_credits (user_id, credits, plan, plan_started_at, updated_at)
select id, 0, 'unlimited', now(), now()
from auth.users
where email = 'aroozka@gmail.com'
on conflict (user_id) do update
set
  plan = 'unlimited',
  credits = 0,
  plan_started_at = coalesce(public.user_credits.plan_started_at, now()),
  updated_at = now();
