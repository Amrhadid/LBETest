-- =============================================================================
-- LBET — Basic item exposure tracking (step 18, exam integrity)
-- =============================================================================
-- Idempotent. Requires 0001–0009.
--
-- Adds an exposure_count on items, incremented once per real (non-preview)
-- attempt when the exam's items are served. Full exposure-control logic (item
-- rotation, retirement thresholds) isn't meaningful with a single exam version
-- yet — this just puts the tracking mechanism in place.
--
-- Increment is done via bump_item_exposure, SECURITY DEFINER and granted only
-- to service_role, so it can't be called by candidates to skew counts; the app
-- invokes it with the service-role client when a new attempt is created.
-- =============================================================================

alter table public.items
  add column if not exists exposure_count integer not null default 0;

comment on column public.items.exposure_count is
  'Number of times this item has been served to a real (non-preview) candidate attempt. Basic exposure tracking (step 18).';

create or replace function public.bump_item_exposure(p_exam_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.items
     set exposure_count = exposure_count + 1
   where exam_id = p_exam_id and active;
$$;

revoke all on function public.bump_item_exposure(uuid) from public, anon, authenticated;
grant execute on function public.bump_item_exposure(uuid) to service_role;

-- =============================================================================
-- End of migration.
-- =============================================================================
