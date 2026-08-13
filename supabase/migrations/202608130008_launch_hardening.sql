-- Billing records are written only by trusted server routes using the service role.
drop policy if exists checkout_attempts_own on public.checkout_attempts;
drop policy if exists subscriptions_own on public.subscriptions;
drop policy if exists checkout_attempts_read_own on public.checkout_attempts;
drop policy if exists subscriptions_read_own on public.subscriptions;

create policy checkout_attempts_read_own
on public.checkout_attempts for select to authenticated
using ((select auth.uid()) = user_id);

create policy subscriptions_read_own
on public.subscriptions for select to authenticated
using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.checkout_attempts from authenticated;
revoke insert, update, delete on public.subscriptions from authenticated;
grant select on public.checkout_attempts, public.subscriptions to authenticated;
