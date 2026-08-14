# LifeLens production AI setup

LifeLens uses paid Gemini models on **Gemini Enterprise Agent Platform** (formerly Vertex AI) from server-only route handlers. AI review is opt-in: a stored PDF, PNG, or JPEG is sent to Agent Platform only after the user clicks **Review with AI**. Extracted medication fields remain drafts until the user edits and confirms them.

## Supabase

Apply `supabase/migrations/202608140001_ai_document_extraction.sql`. It creates user-scoped request and extraction records and adds idempotent source fields to medications.

## Gemini Enterprise Agent Platform

1. Enable billing and the Gemini Enterprise Agent Platform API (`aiplatform.googleapis.com`) in the production Google Cloud project.
2. Create a dedicated service account with only the permissions required to invoke Agent Platform models. The predefined role is currently named Agent Platform User (`roles/aiplatform.user`).
3. Connect Vercel OIDC to Google Workload Identity Federation. This is the preferred production authentication method and does not require a service-account key.
4. Add the following server-only variables to the production environment:

   - `GOOGLE_VERTEX_PROJECT`
   - `GOOGLE_VERTEX_LOCATION`
   - `GOOGLE_VERTEX_MODEL`
   - `GCP_PROJECT_NUMBER`
   - `GCP_SERVICE_ACCOUNT_EMAIL`
   - `GCP_WORKLOAD_IDENTITY_POOL_ID`
   - `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID`
   - `AI_DOCUMENT_REVIEW_ENABLED=true` after verification

5. Keep `GOOGLE_VERTEX_MODEL` pinned to a stable, generally available model. The environment-variable and package names retain `VERTEX` for compatibility with the current `@ai-sdk/google-vertex` provider; the calls go to Gemini Enterprise Agent Platform. The application default is `gemini-2.5-flash`.
6. Request and configure Google zero-data retention before accepting regulated health information.

The application prefers Workload Identity Federation when its four `GCP_*` variables are present. `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` remain supported only as a local or legacy fallback. Never prefix authentication configuration with `NEXT_PUBLIC_`. Do not enable Google Search grounding, stored model conversations, the Gemini File API, or explicit context caching for identifiable health documents.

## Operational checks

- Test with synthetic or properly de-identified documents first.
- Confirm PDF, JPEG, and PNG extraction separately.
- Verify users cannot review or confirm another user's extraction.
- Confirm document text and AI output never appear in application, analytics, or error logs.
- Monitor failed requests, latency, and token counts without recording prompt bodies.
- Keep AI document review behind a feature flag until the extraction evaluation set passes.
