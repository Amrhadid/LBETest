-- =============================================================================
-- LBET — Certificate storage bucket + one-cert-per-attempt guard (step 11)
-- =============================================================================
-- Idempotent. Requires 0001–0007.
--
-- The certificates TABLE already exists (0001): cert_code (unique, public
-- lookup), issue_hash (integrity), lbe_level, score, pdf_url, status, issued_at,
-- expires_at. This migration only adds:
--   1. A private `certificates` storage bucket for the generated PDFs, mirroring
--      the responses-audio pattern (owner reads own, staff read all, writes via
--      the service role only).
--   2. A unique index so at most one certificate is ever created per attempt —
--      the generation trigger is idempotent even if grading resolves twice.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. certificates storage bucket (private). Files keyed "<user_id>/<code>.pdf".
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do nothing;

-- Owner: read own certificate PDFs (first path segment = their uid).
drop policy if exists certificates_owner_read on storage.objects;
create policy certificates_owner_read on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Staff: read every certificate PDF.
drop policy if exists certificates_staff_read on storage.objects;
create policy certificates_staff_read on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'certificates'
    and public.is_grader()
  );

-- No insert/update/delete policy for end users: PDFs are written only by the
-- service-role finalizer, which bypasses RLS.

-- -----------------------------------------------------------------------------
-- 2. One certificate per attempt (idempotent generation).
-- -----------------------------------------------------------------------------
create unique index if not exists uq_certificates_attempt
  on public.certificates (attempt_id)
  where attempt_id is not null;

-- =============================================================================
-- End of migration.
-- =============================================================================
