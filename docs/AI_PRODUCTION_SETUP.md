# LifeLens AI document review setup

LifeLens uses the Gemini Developer API from server-only route handlers. Authentication requires one API key; it does not use Vertex AI, IAM roles, service-account keys, or Workload Identity Federation.

AI review is opt-in. A stored PDF, PNG, or JPEG is sent to Gemini only after the user clicks **Review with AI**. Extracted medication fields remain drafts until the user edits and confirms them.

## Supabase

Apply `supabase/migrations/202608140001_ai_document_extraction.sql`. It creates user-scoped request and extraction records and adds idempotent source fields to medications.

## Gemini Developer API

1. Open Google AI Studio and create a Gemini API key.
2. Add these server-only production variables:

   - `GEMINI_API_KEY`
   - `GEMINI_MODEL=gemini-2.5-flash`
   - `AI_DOCUMENT_REVIEW_ENABLED=false`

3. Never prefix the API key with `NEXT_PUBLIC_`.
4. Keep AI review disabled for genuine medical records while using unpaid Gemini services.

## Free-tier privacy boundary

Google's unpaid Gemini terms say submitted content and generated responses may be used to improve its products and may be processed by human reviewers. Do not send personal, confidential, sensitive, or identifiable health information through the unpaid service.

The free tier is suitable only for synthetic or properly de-identified evaluation documents. Set `AI_DOCUMENT_REVIEW_ENABLED=true` only in a controlled test environment using that data. Before enabling the feature for real user documents, move to service terms and data controls appropriate for identifiable health information.

## Operational checks

- Test with synthetic or properly de-identified documents only.
- Confirm PDF, JPEG, and PNG extraction separately.
- Verify users cannot review or confirm another user's extraction.
- Confirm document text and AI output never appear in application, analytics, or error logs.
- Monitor failures, latency, and token counts without recording prompt bodies.
