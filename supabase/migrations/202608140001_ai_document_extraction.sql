create table if not exists public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  status text not null check (status in ('PROCESSING','SUCCEEDED','FAILED')),
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  model text not null,
  prompt_version text not null,
  output jsonb not null,
  confirmed_items integer[] not null default '{}',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.medications add column if not exists source_extraction_id uuid references public.document_extractions(id) on delete set null;
alter table public.medications add column if not exists source_item_index integer;
create unique index if not exists medications_extraction_item_unique
on public.medications(source_extraction_id, source_item_index)
where source_extraction_id is not null;

alter table public.ai_requests enable row level security;
alter table public.document_extractions enable row level security;

drop policy if exists ai_requests_own on public.ai_requests;
create policy ai_requests_own on public.ai_requests for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists document_extractions_own on public.document_extractions;
create policy document_extractions_own on public.document_extractions for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update on public.ai_requests to authenticated;
grant select, insert, update on public.document_extractions to authenticated;
create index if not exists ai_requests_user_created_idx on public.ai_requests(user_id, created_at desc);
create index if not exists document_extractions_user_document_idx on public.document_extractions(user_id, document_id, created_at desc);
