-- 0021_drop_certificate_percentile.sql
-- The certificate now shows a "Core Competencies Evaluated" panel instead of a
-- cohort percentile, so the persisted percentile_rank column is no longer used.
-- Drop it. Safe/idempotent; no data of value is lost (it was display-only).

alter table public.certificates
  drop column if exists percentile_rank;
