-- Accepted members may read an owner's timeline only when the owner enabled it.
drop policy if exists "timeline_events_family_read" on public.timeline_events;
create policy "timeline_events_family_read" on public.timeline_events for select to authenticated using (
  exists (
    select 1 from public.family_members f
    where f.user_id=timeline_events.user_id
      and f.member_user_id=(select auth.uid())
      and f.status='accepted'
      and f.can_view_timeline
  )
);

-- The Family Journal is collaborative: accepted members can read entries for circles they joined.
drop policy if exists "family_checkins_member_read" on public.family_checkins;
create policy "family_checkins_member_read" on public.family_checkins for select to authenticated using (
  exists (
    select 1 from public.family_members f
    where f.user_id=family_checkins.owner_id
      and f.member_user_id=(select auth.uid())
      and f.status='accepted'
  )
);
