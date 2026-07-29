-- Freeze the displayed cohort percentile at issue time so a downloaded
-- certificate and its verification record always agree.
alter table public.certificates
  add column if not exists percentile_rank integer
  check (percentile_rank between 0 and 100);

comment on column public.certificates.percentile_rank is
  'Percent of scored, non-preview attempts in the same exam with a lower score at issue time.';
