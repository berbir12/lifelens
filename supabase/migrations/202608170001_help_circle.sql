create table if not exists public.help_boards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[A-Za-z0-9_-]{32,80}$'),
  circle_label text not null check (char_length(circle_label) between 1 and 80),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.help_tasks (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.help_boards(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  details text check (details is null or char_length(details) <= 500),
  due_at timestamptz,
  claimed_by text check (claimed_by is null or char_length(claimed_by) between 1 and 60),
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.help_updates (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.help_boards(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 60),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists help_boards_owner_created_idx on public.help_boards(owner_id, created_at desc);
create index if not exists help_tasks_board_created_idx on public.help_tasks(board_id, created_at desc);
create index if not exists help_updates_board_created_idx on public.help_updates(board_id, created_at desc);

alter table public.help_boards enable row level security;
alter table public.help_tasks enable row level security;
alter table public.help_updates enable row level security;

create policy "help_boards_owner_all" on public.help_boards for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "help_tasks_owner_all" on public.help_tasks for all to authenticated
  using (exists (select 1 from public.help_boards b where b.id = board_id and b.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.help_boards b where b.id = board_id and b.owner_id = (select auth.uid())));
create policy "help_updates_owner_all" on public.help_updates for all to authenticated
  using (exists (select 1 from public.help_boards b where b.id = board_id and b.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.help_boards b where b.id = board_id and b.owner_id = (select auth.uid())));

grant select, insert, update, delete on public.help_boards, public.help_tasks, public.help_updates to authenticated;
revoke all on public.help_boards, public.help_tasks, public.help_updates from anon;

-- Anonymous access is restricted to these slug-scoped functions. Helpers never
-- receive direct table privileges and archived boards fail closed.
create or replace function public.public_help_board(board_slug text)
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'id', b.id, 'label', b.circle_label, 'slug', b.slug,
    'tasks', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'details', t.details, 'dueAt', t.due_at, 'claimedBy', t.claimed_by, 'claimedAt', t.claimed_at, 'createdAt', t.created_at) order by t.created_at desc) from public.help_tasks t where t.board_id = b.id), '[]'::jsonb),
    'updates', coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'authorName', u.author_name, 'body', u.body, 'createdAt', u.created_at) order by u.created_at desc) from public.help_updates u where u.board_id = b.id), '[]'::jsonb)
  ) from public.help_boards b where b.slug = board_slug and b.archived_at is null;
$$;

create or replace function public.public_add_help_task(board_slug text, task_title text, task_details text default null, task_due_at timestamptz default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare board_uuid uuid; task_uuid uuid;
begin
  if char_length(trim(task_title)) not between 1 and 120 or char_length(coalesce(task_details, '')) > 500 then raise exception 'invalid task'; end if;
  select id into board_uuid from public.help_boards where slug = board_slug and archived_at is null;
  if board_uuid is null then raise exception 'board unavailable'; end if;
  if (select count(*) from public.help_tasks where board_id = board_uuid) >= 250 then raise exception 'task limit reached'; end if;
  insert into public.help_tasks(board_id, title, details, due_at) values (board_uuid, trim(task_title), nullif(trim(task_details), ''), task_due_at) returning id into task_uuid;
  return task_uuid;
end $$;

create or replace function public.public_claim_help_task(board_slug text, task_uuid uuid, helper_name text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if char_length(trim(helper_name)) not between 1 and 60 then raise exception 'invalid name'; end if;
  update public.help_tasks t set claimed_by = trim(helper_name), claimed_at = now()
  from public.help_boards b where t.id = task_uuid and t.board_id = b.id and b.slug = board_slug and b.archived_at is null and t.claimed_by is null;
  return found;
end $$;

create or replace function public.public_add_help_update(board_slug text, helper_name text, update_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare board_uuid uuid; update_uuid uuid;
begin
  if char_length(trim(helper_name)) not between 1 and 60 or char_length(trim(update_body)) not between 1 and 500 then raise exception 'invalid update'; end if;
  select id into board_uuid from public.help_boards where slug = board_slug and archived_at is null;
  if board_uuid is null then raise exception 'board unavailable'; end if;
  if (select count(*) from public.help_updates where board_id = board_uuid) >= 500 then raise exception 'update limit reached'; end if;
  insert into public.help_updates(board_id, author_name, body) values (board_uuid, trim(helper_name), trim(update_body)) returning id into update_uuid;
  return update_uuid;
end $$;

revoke all on function public.public_help_board(text) from public;
revoke all on function public.public_add_help_task(text,text,text,timestamptz) from public;
revoke all on function public.public_claim_help_task(text,uuid,text) from public;
revoke all on function public.public_add_help_update(text,text,text) from public;
grant execute on function public.public_help_board(text) to anon, authenticated;
grant execute on function public.public_add_help_task(text,text,text,timestamptz) to anon, authenticated;
grant execute on function public.public_claim_help_task(text,uuid,text) to anon, authenticated;
grant execute on function public.public_add_help_update(text,text,text) to anon, authenticated;
