alter table public.help_tasks add column if not exists created_by text check (created_by is null or char_length(created_by) between 1 and 60);
alter table public.help_tasks add column if not exists completed_by text check (completed_by is null or char_length(completed_by) between 1 and 60);
alter table public.help_tasks add column if not exists completed_at timestamptz;

drop function if exists public.public_add_help_task(text,text,text,timestamptz);

create or replace function public.public_help_board(board_slug text)
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'id', b.id, 'label', b.circle_label, 'slug', b.slug,
    'tasks', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'details', t.details, 'dueAt', t.due_at, 'createdBy', t.created_by, 'claimedBy', t.claimed_by, 'claimedAt', t.claimed_at, 'completedBy', t.completed_by, 'completedAt', t.completed_at, 'createdAt', t.created_at) order by t.created_at desc) from public.help_tasks t where t.board_id = b.id), '[]'::jsonb),
    'updates', coalesce((select jsonb_agg(jsonb_build_object('id', u.id, 'authorName', u.author_name, 'body', u.body, 'createdAt', u.created_at) order by u.created_at desc) from public.help_updates u where u.board_id = b.id), '[]'::jsonb)
  ) from public.help_boards b where b.slug = board_slug and b.archived_at is null;
$$;

create or replace function public.public_add_help_task(board_slug text, task_title text, task_details text, task_due_at timestamptz, helper_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare board_uuid uuid; task_uuid uuid;
begin
  if char_length(trim(task_title)) not between 1 and 120 or char_length(coalesce(task_details, '')) > 500 or char_length(trim(helper_name)) not between 1 and 60 then raise exception 'invalid task'; end if;
  select id into board_uuid from public.help_boards where slug = board_slug and archived_at is null;
  if board_uuid is null then raise exception 'board unavailable'; end if;
  if (select count(*) from public.help_tasks where board_id = board_uuid) >= 250 then raise exception 'task limit reached'; end if;
  insert into public.help_tasks(board_id, title, details, due_at, created_by) values (board_uuid, trim(task_title), nullif(trim(task_details), ''), task_due_at, trim(helper_name)) returning id into task_uuid;
  return task_uuid;
end $$;

create or replace function public.public_complete_help_task(board_slug text, task_uuid uuid, helper_name text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if char_length(trim(helper_name)) not between 1 and 60 then raise exception 'invalid name'; end if;
  update public.help_tasks t set completed_by = trim(helper_name), completed_at = now()
  from public.help_boards b where t.id = task_uuid and t.board_id = b.id and b.slug = board_slug and b.archived_at is null and t.completed_at is null;
  return found;
end $$;

revoke all on function public.public_add_help_task(text,text,text,timestamptz,text) from public;
revoke all on function public.public_complete_help_task(text,uuid,text) from public;
grant execute on function public.public_add_help_task(text,text,text,timestamptz,text) to anon, authenticated;
grant execute on function public.public_complete_help_task(text,uuid,text) to anon, authenticated;
