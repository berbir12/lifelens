alter table public.family_members add column if not exists invite_token_hash text;
alter table public.family_members add column if not exists invite_expires_at timestamptz;
alter table public.family_members add column if not exists accepted_at timestamptz;
alter table public.family_members add column if not exists email_sent_at timestamptz;
alter table public.family_members add column if not exists email_delivery_id text;
create unique index if not exists family_members_invite_token_hash_unique on public.family_members(invite_token_hash) where invite_token_hash is not null;

-- Account matching alone does not constitute consent.
create or replace function public.match_family_invitation() returns trigger language plpgsql security definer set search_path=public,auth as $$
begin select id into new.member_user_id from auth.users where lower(email)=lower(new.email) limit 1; return new; end $$;

drop trigger if exists accept_family_invitations_on_signup on auth.users;
drop function if exists public.accept_family_invitations();
create or replace function public.link_family_invitations_on_signup() returns trigger language plpgsql security definer set search_path=public,auth as $$
begin update public.family_members set member_user_id=new.id where lower(email)=lower(new.email) and member_user_id is null and status='invited'; return new; end $$;
create trigger accept_family_invitations_on_signup after insert on auth.users for each row execute function public.link_family_invitations_on_signup();

-- An email match links the account for acceptance, but grants no access by itself.
drop policy if exists "family_members_member_read" on public.family_members;
create policy "family_members_member_read" on public.family_members for select to authenticated using ((select auth.uid())=member_user_id and status='accepted');
drop policy if exists "family_checkins_member_insert" on public.family_checkins;
create policy "family_checkins_member_insert" on public.family_checkins for insert to authenticated with check ((select auth.uid())=author_id and exists(select 1 from public.family_members f where f.user_id=owner_id and f.member_user_id=(select auth.uid()) and f.can_contribute and f.status='accepted'));
