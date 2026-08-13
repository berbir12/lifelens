create table if not exists public.habits (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, name text not null, icon text, created_at timestamptz not null default now(), unique(user_id,name));
create table if not exists public.habit_logs (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, habit_id uuid not null references public.habits(id) on delete cascade, logged_on date not null default current_date, created_at timestamptz not null default now(), unique(habit_id,logged_on));
create table if not exists public.medical_expenses (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, expense_date date not null default current_date, category text not null, provider text, amount numeric(12,2) not null check(amount>=0), currency text not null default 'USD', insurance_paid numeric(12,2) not null default 0, notes text, created_at timestamptz not null default now());
create table if not exists public.family_history (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, relative_name text not null, relationship text not null, conditions text[] not null default '{}', created_at timestamptz not null default now());
create table if not exists public.health_capsules (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, month date not null, snapshot jsonb not null, locked_at timestamptz not null default now(), unique(user_id,month));
do $$
declare
  t text;
begin
  foreach t in array array[
    'habits',
    'habit_logs',
    'medical_expenses',
    'family_history',
    'health_capsules'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_own',
      t
    );
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated',
      t
    );
  end loop;
end
$$;
