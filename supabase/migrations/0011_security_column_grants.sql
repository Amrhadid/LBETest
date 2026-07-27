-- =============================================================================
-- LBET — Security hardening: column-level write privileges (step 19 audit)
-- =============================================================================
-- Idempotent. Requires 0001–0010.
--
-- RLS gates which ROWS a role may touch, but it cannot gate which COLUMNS.
-- Candidates legitimately update their own attempts/responses/profile row, and
-- the default Supabase grants gave `authenticated` write on EVERY column — so a
-- candidate could, via direct PostgREST calls, set their own grade fields,
-- final score/level, or even their role. This migration restricts client write
-- privileges to exactly the columns each flow needs. All grading, scoring,
-- certification and admin writes go through the service role or SECURITY
-- DEFINER RPCs, which are unaffected by these grants.
-- =============================================================================

-- profiles: a user may edit only their display name / locale, never their role.
-- (Role changes go through the admin server action, which uses the service role.)
revoke insert, update on public.profiles from anon, authenticated;
grant update (full_name, locale) on public.profiles to authenticated;

-- attempts: a candidate may create an attempt and submit it — never write the
-- score, level, status transitions to 'scored', or the is_preview flag.
revoke insert, update on public.attempts from anon, authenticated;
grant insert (user_id, exam_id, access_code_id, status, started_at)
  on public.attempts to authenticated;
grant update (status, submitted_at) on public.attempts to authenticated;

-- responses: a candidate may write only their answer (the attempt_id/item_id are
-- the upsert conflict key). Scores, is_correct, grade_status, ai_* and
-- graded/approved fields are written only by scoring RPCs and the grader.
revoke insert, update on public.responses from anon, authenticated;
grant insert (attempt_id, item_id, answer) on public.responses to authenticated;
grant update (attempt_id, item_id, answer) on public.responses to authenticated;

-- section_scores: written only by score_section (SECURITY DEFINER). No client writes.
revoke insert, update, delete on public.section_scores from anon, authenticated;

-- Admin-managed tables: every write goes through the service role (admin server
-- actions) or a SECURITY DEFINER RPC. RLS already blocks non-admins; drop the
-- redundant client write grants for least privilege.
revoke insert, update, delete on public.items         from anon, authenticated;
revoke insert, update, delete on public.exams         from anon, authenticated;
revoke insert, update, delete on public.certificates  from anon, authenticated;
revoke insert, update, delete on public.access_codes  from anon, authenticated;
revoke insert, update, delete on public.forms         from anon, authenticated;
revoke insert, update, delete on public.organizations from anon, authenticated;
revoke insert, update, delete on public.memberships   from anon, authenticated;

-- The new-user trigger function is invoked by the trigger, never via the API.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Auth-required RPCs never need the anon role.
revoke execute on function public.redeem_access_code(text) from anon;
revoke execute on function public.score_section(uuid, integer) from anon;
revoke execute on function public.score_attempt(uuid) from anon;

-- =============================================================================
-- End of migration.
-- =============================================================================
