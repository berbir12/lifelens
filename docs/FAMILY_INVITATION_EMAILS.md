# Family invitation email setup

LifeLens sends family invitations through Resend. The invitation URL is single-use, expires after seven days, and must be accepted while signed in with the invited email address.

1. In Resend, add and verify `bitlabsbuild.com`. Publish the DKIM and SPF DNS records Resend provides.
2. Create a sending API key and add these server-only production variables:
   - `RESEND_API_KEY`
   - `LIFELENS_EMAIL_FROM=LifeLens <lifelens@bitlabsbuild.com>`
3. Keep `NEXT_PUBLIC_APP_URL=https://lifelens.bitlabsbuild.com` set in production.
4. Run `supabase/migrations/202608140002_family_invitations.sql` in Supabase.
5. Redeploy, then send a new invitation. Previously pending rows must be re-invited so they receive a fresh token.

Do not expose `RESEND_API_KEY` in a variable prefixed with `NEXT_PUBLIC_`.
