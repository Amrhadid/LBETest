-- =============================================================================
-- LBET — Role simplification + AI-failure visibility & manual grading
-- =============================================================================
-- Idempotent. Requires 0001–0006.
--
-- 1. Roles collapse to two staff roles going forward: 'admin' and 'teacher'
--    (plus 'candidate', the default for test-takers). super_admin/grader and the
--    unused org roles are migrated away and dropped from the check constraint.
--    The owner email is auto-assigned 'admin' on sign-up.
-- 2. AI-grading failures become visible to staff: responses.grade_status gains
--    a 'failed' state, and a teacher can grade such items by hand via
--    grade_response_manual. The student's answer + audio are already preserved
--    independently of grading, so manual grading always has what it needs.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Roles → { candidate, teacher, admin }
-- -----------------------------------------------------------------------------
-- Migrate any legacy roles before tightening the constraint.
update public.profiles set role = 'admin'   where role = 'super_admin';
update public.profiles set role = 'teacher' where role = 'grader';
update public.profiles set role = 'candidate'
  where role in ('company_admin','company_member','institution_admin');

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('candidate','teacher','admin'));

-- Role helpers: redefine for the two-role model (names kept so existing RLS
-- policies keep working). is_grader/is_staff now both mean "admin or teacher".
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_name() = 'admin';
$$;

create or replace function public.is_grader()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_name() in ('admin','teacher');
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_name() in ('admin','teacher');
$$;

-- Auto-assign 'admin' to the owner email on sign-up; everyone else is a candidate.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, locale, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'locale',
    case when lower(new.email) = 'siramrhadid@gmail.com' then 'admin' else 'candidate' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. AI-failure visibility: grade_status 'failed'
-- -----------------------------------------------------------------------------
alter table public.responses drop constraint if exists responses_grade_status_check;
alter table public.responses
  add constraint responses_grade_status_check
  check (grade_status is null
         or grade_status in ('pending_approval','approved','rejected','failed'));

comment on column public.responses.grade_status is
  'Approval state of the AI proposal: pending_approval | approved | rejected | failed. failed = AI grading errored (bad key / API error / rate limit); the answer + audio are preserved for manual grading. NULL for auto-graded responses.';

-- -----------------------------------------------------------------------------
-- Manual grading — a teacher scores an item by hand (failed or pending).
-- Authoritative: writes score/is_correct directly, graded_by='teacher'.
-- -----------------------------------------------------------------------------
create or replace function public.grade_response_manual(
  p_response_id uuid,
  p_score       numeric,
  p_is_correct  boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_grader() or public.is_admin()) then
    raise exception 'not authorized to grade';
  end if;

  update public.responses
     set score        = p_score,
         is_correct   = p_is_correct,
         grade_status = 'approved',
         graded_by    = 'teacher',
         approved_by  = auth.uid(),
         approved_at  = now()
   where id = p_response_id;

  if not found then
    raise exception 'response % not found', p_response_id;
  end if;

  update public.review_queue
     set status = 'resolved', resolved_by = auth.uid(), resolved_at = now()
   where response_id = p_response_id and status = 'open';
end;
$$;

revoke all on function public.grade_response_manual(uuid, numeric, boolean) from public, anon;
grant execute on function public.grade_response_manual(uuid, numeric, boolean) to authenticated;

-- =============================================================================
-- End of migration.
-- =============================================================================
