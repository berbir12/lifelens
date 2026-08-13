create table if not exists public.documents (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, name text not null, mime_type text not null, storage_key text not null unique, size_bytes bigint not null, status text not null default 'READY', created_at timestamptz not null default now());
alter table public.documents enable row level security;
drop policy if exists "documents_own" on public.documents;
create policy "documents_own" on public.documents for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select,insert,update,delete on public.documents to authenticated;
create index if not exists documents_user_idx on public.documents(user_id,created_at desc);
