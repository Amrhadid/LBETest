-- =============================================================================
-- LBET — Preview (reviewer) attempts (admin dashboard, step 14)
-- =============================================================================
-- Idempotent. Requires 0001–0008.
--
-- Admins/teachers can walk the real candidate exam UI via "Preview exam"
-- without an access code. Those attempts are flagged is_preview = true and must
-- be permanently excluded from every KPI, result, and certificate. Preview
-- attempts never run AI grading, never finalize a score, and never issue a
-- certificate (enforced in app code: submitAttempt + finalizeAttempt).
-- =============================================================================

alter table public.attempts
  add column if not exists is_preview boolean not null default false;

comment on column public.attempts.is_preview is
  'True for admin/teacher preview runs of the exam. Preview attempts are excluded from all KPIs, results and certificates and never grade or certify.';

-- Fast filter for the (few) preview rows when excluding them from stats.
create index if not exists idx_attempts_is_preview
  on public.attempts (is_preview) where is_preview;

-- =============================================================================
-- End of migration.
-- =============================================================================
