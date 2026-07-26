-- =============================================================================
-- LBET — AI grade approval workflow + voice-grading columns (step 9, part 2)
-- =============================================================================
-- Idempotent. Requires 0001–0005.
--
-- Policy change (supersedes the earlier "spot-check only" design): an AI grade
-- is NEVER final on its own. Every AI-produced grade (text types 4/5 and voice
-- types 3/6) is stored as a *proposal* and must be approved by a teacher/admin
-- before it counts toward section pass/fail, final score, or a certificate.
--
-- This migration:
--   1. Adds proposal columns to responses (ai_score, ai_is_correct,
--      grade_status, approved_by, approved_at). The authoritative score/
--      is_correct columns stay NULL until a human approves.
--   2. Adds approve_response_grade(p_response_id, p_decision) — staff-only
--      SECURITY DEFINER RPC that promotes (or rejects) a proposed grade and
--      resolves the response's review_queue rows.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. responses: AI-grade proposal columns
-- -----------------------------------------------------------------------------
alter table public.responses
  add column if not exists ai_score      numeric,   -- proposed points (not yet counted)
  add column if not exists ai_is_correct boolean,   -- proposed pass/fail (not yet counted)
  add column if not exists grade_status  text,      -- null | 'pending_approval' | 'approved' | 'rejected'
  add column if not exists approved_by   uuid references public.profiles (id) on delete set null,
  add column if not exists approved_at   timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'responses_grade_status_check'
  ) then
    alter table public.responses
      add constraint responses_grade_status_check
      check (grade_status is null
             or grade_status in ('pending_approval','approved','rejected'));
  end if;
end$$;

comment on column public.responses.ai_score is
  'AI-proposed score. NOT authoritative — copied into responses.score only when a teacher/admin approves via approve_response_grade.';
comment on column public.responses.ai_is_correct is
  'AI-proposed pass/fail. NOT authoritative — copied into responses.is_correct only on approval.';
comment on column public.responses.grade_status is
  'Approval state of the AI proposal: pending_approval | approved | rejected. NULL for auto-graded (MCQ/term) responses that need no approval.';

create index if not exists idx_responses_grade_status
  on public.responses (grade_status)
  where grade_status = 'pending_approval';

-- One open review flag reason: a proposal awaiting approval. Lets the review
-- queue surface every AI grade as a required gate, not just low-confidence ones.
-- (review_queue.reason is free text; no schema change needed.)

-- -----------------------------------------------------------------------------
-- 2. approve_response_grade — staff-only promote/reject of an AI proposal
-- -----------------------------------------------------------------------------
create or replace function public.approve_response_grade(
  p_response_id uuid,
  p_decision    text            -- 'approve' | 'reject'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_score      numeric;
  v_is_correct boolean;
  v_status     text;
begin
  if not (public.is_grader() or public.is_admin()) then
    raise exception 'not authorized to approve grades';
  end if;

  if p_decision not in ('approve','reject') then
    raise exception 'p_decision must be approve or reject';
  end if;

  select ai_score, ai_is_correct, grade_status
    into v_score, v_is_correct, v_status
    from public.responses
   where id = p_response_id
   for update;

  if not found then
    raise exception 'response % not found', p_response_id;
  end if;

  if v_status is distinct from 'pending_approval' then
    raise exception 'response % is not pending approval (status: %)',
      p_response_id, coalesce(v_status, 'none');
  end if;

  if p_decision = 'approve' then
    -- Promote the proposal to the authoritative columns.
    update public.responses
       set score        = v_score,
           is_correct   = v_is_correct,
           grade_status = 'approved',
           graded_by    = 'ai_approved',
           graded_at    = now(),
           approved_by  = auth.uid(),
           approved_at  = now()
     where id = p_response_id;
  else
    -- Reject: leave score/is_correct NULL; a human can grade manually later.
    update public.responses
       set grade_status = 'rejected',
           approved_by  = auth.uid(),
           approved_at  = now()
     where id = p_response_id;
  end if;

  -- Resolve any open review_queue rows tied to this response.
  update public.review_queue
     set status      = 'resolved',
         resolved_by = auth.uid(),
         resolved_at = now()
   where response_id = p_response_id
     and status = 'open';
end;
$$;

revoke all on function public.approve_response_grade(uuid, text) from public, anon;
grant execute on function public.approve_response_grade(uuid, text) to authenticated;

-- =============================================================================
-- End of migration.
-- =============================================================================
