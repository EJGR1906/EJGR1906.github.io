create extension if not exists pgcrypto;

create table if not exists public.accounts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  institution_id text,
  type text not null check (type in ('cash', 'bank', 'crypto', 'wallet', 'other')),
  currency text not null check (currency in ('VES', 'USD', 'USDT')),
  initial_balance numeric not null default 0,
  active boolean not null default true,
  nature text not null default 'asset' check (nature in ('asset', 'liability')),
  credit_limit numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  currency text not null check (currency in ('VES', 'USD', 'USDT')),
  backing_account_id text not null,
  category text not null check (category in ('emergency', 'purchase', 'investment')),
  deadline date,
  active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'transfer', 'goal_contribution', 'goal_withdrawal')),
  amount numeric,
  currency text check (currency in ('VES', 'USD', 'USDT')),
  account_id text,
  category_id text,
  goal_id text,
  from_account_id text,
  to_account_id text,
  from_amount numeric,
  from_currency text check (from_currency in ('VES', 'USD', 'USDT')),
  to_amount numeric,
  to_currency text check (to_currency in ('VES', 'USD', 'USDT')),
  exchange_rate numeric,
  description text,
  date timestamptz not null,
  created_at timestamptz not null
);

create table if not exists public.exchange_rates (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('BCV', 'BINANCE_P2P', 'MANUAL')),
  base_currency text not null check (base_currency in ('VES', 'USD', 'USDT')),
  quote_currency text not null check (quote_currency in ('VES', 'USD', 'USDT')),
  rate numeric not null,
  timestamp timestamptz not null
);

create table if not exists public.recurring_transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'transfer')),
  account_id text,
  from_account_id text,
  to_account_id text,
  category_id text,
  amount numeric,
  currency text check (currency in ('VES', 'USD', 'USDT')),
  from_amount numeric,
  from_currency text check (from_currency in ('VES', 'USD', 'USDT')),
  to_amount numeric,
  to_currency text check (to_currency in ('VES', 'USD', 'USDT')),
  exchange_rate numeric,
  description text,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  next_date date not null,
  end_date date,
  active boolean not null default true,
  last_generated_date date
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  base_currency text not null default 'USD' check (base_currency in ('VES', 'USD', 'USDT')),
  theme text not null default 'light' check (theme in ('light', 'dark')),
  birth_date date,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings add column if not exists phone text;

create index if not exists accounts_user_id_idx on public.accounts(user_id);
create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists transactions_user_id_date_idx on public.transactions(user_id, date desc);
create index if not exists exchange_rates_user_id_timestamp_idx on public.exchange_rates(user_id, timestamp desc);

alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.goals enable row level security;
alter table public.transactions enable row level security;
alter table public.exchange_rates enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.user_settings enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['accounts', 'categories', 'goals', 'transactions', 'exchange_rates', 'recurring_transactions', 'user_settings'] loop
    execute format('drop policy if exists %I_select_own on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_insert_own on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_update_own on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_delete_own on public.%I', table_name, table_name);
    execute format('create policy %I_select_own on public.%I for select using (auth.uid() = user_id)', table_name, table_name);
    execute format('create policy %I_insert_own on public.%I for insert with check (auth.uid() = user_id)', table_name, table_name);
    execute format('create policy %I_update_own on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name, table_name);
    execute format('create policy %I_delete_own on public.%I for delete using (auth.uid() = user_id)', table_name, table_name);
  end loop;
end $$;
