-- =============================================================================
-- LBET — Lock down attempt status transitions (step 19 audit follow-up)
-- =============================================================================
-- Idempotent. Requires 0001–0011.
--
-- After 0011, a candidate still held UPDATE (status, submitted_at) on their own
-- attempt, so a raw API call could set status to 'scored'/'certified'/anything.
-- Only the real submit flow should advance status. This migration:
--   1. Removes the client's UPDATE grant on attempts entirely.
--   2. Adds submit_attempt(), a SECURITY DEFINER RPC that performs the ONLY
--      client-allowed transition: in_progress -> submitted (owner only).
--   3. Constrains candidate-created attempts to status='in_progress' and
--      is_preview=false, so a fresh attempt can't be born 'scored' either.
-- finalize (service role) still sets 'scored'; preview attempts are created by
-- the service role, which bypasses RLS.
-- =============================================================================

-- 1. Candidates can no longer write attempts.status/submitted_at directly.
revoke update (status, submitted_at) on public.attempts from authenticated;

-- 2. The only client-driven transition, via a definer RPC.
create or replace function public.submit_attempt(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_owner  uuid;
  v_status text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select user_id, status into v_owner, v_status
    from public.attempts where id = p_attempt_id;

  if v_owner is null then
    raise exception 'attempt_not_found' using errcode = 'P0001';
  end if;
  if v_owner <> v_uid then
    raise exception 'not_authorized' using errcode = 'P0001';
  end if;

  -- Only advance a live attempt. Already-submitted/scored attempts are a no-op
  -- (idempotent) so a re-submit can't reset or regress state.
  if v_status = 'in_progress' then
    update public.attempts
       set status = 'submitted', submitted_at = now()
     where id = p_attempt_id;
  end if;
end;
$$;

revoke all on function public.submit_attempt(uuid) from public, anon;
grant execute on function public.submit_attempt(uuid) to authenticated;

-- 3. A candidate-created attempt must start in_progress and non-preview.
drop policy if exists attempts_insert_own on public.attempts;
create policy attempts_insert_own on public.attempts
  for insert
  with check (
    (user_id = auth.uid() and status = 'in_progress' and is_preview = false)
    or public.is_admin()
  );

-- =============================================================================
-- End of migration.
-- =============================================================================
