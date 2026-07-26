-- =============================================================================
-- LBET — server-side auto-scoring for selection items (step 8)
-- =============================================================================
-- Idempotent. Requires 0001–0003.
--
-- Scope: auto-grade the single-select items only —
--   question_type 1 (choose the correct answer) and 2 (choose the wrong answer).
-- These are the "6 MCQ + 1 choose-wrong = 7 auto-gradable per section" items.
-- Free/spoken items (types 3, 4, 5, 6) are graded later by AI (step 9) and are
-- left untouched here.
--
-- Provisional-only: because just 7 of 10 items per section are auto-graded, a
-- section's real 6/10 pass/fail can't be finalized until the open-ended items
-- are graded — EXCEPT the edge case of ≥6 correct from the auto 7 alone. This
-- step produces the auto tally; final pass/fail waits on step 9.
--
-- Nothing here is candidate-facing: section_scores is readable only by staff.
-- =============================================================================

-- Which question types are auto-graded by exact selection match in this step.
-- (Kept inline in the functions below; documented here for clarity.)
--   1 = choose the correct answer   → answer.selected == answer_key.correct
--   2 = choose the wrong answer      → answer.selected == answer_key.correct
--     (answer_key.correct holds the intended selection for both.)

-- -----------------------------------------------------------------------------
-- section_scores: per-attempt, per-section auto tally (bookkeeping only)
-- -----------------------------------------------------------------------------
create table if not exists public.section_scores (
  attempt_id         uuid not null references public.attempts (id) on delete cascade,
  lbe_level          int  not null,               -- section id (1:1 with LBE level)
  auto_correct_count int  not null default 0,     -- correct auto-graded (0..auto_total)
  auto_total         int  not null default 0,     -- auto-gradable items in the section (=7)
  updated_at         timestamptz not null default now(),
  primary key (attempt_id, lbe_level)
);

alter table public.section_scores enable row level security;

-- Staff only. Candidates must NOT read this (no interim feedback). No candidate
-- policy is defined, so RLS denies them by default; the scoring functions write
-- via SECURITY DEFINER and bypass RLS.
drop policy if exists section_scores_staff_read on public.section_scores;
create policy section_scores_staff_read on public.section_scores
  for select using (public.is_grader() or public.is_admin());

drop policy if exists section_scores_admin_all on public.section_scores;
create policy section_scores_admin_all on public.section_scores
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- score_section(): auto-grade one section and upsert its tally
-- -----------------------------------------------------------------------------
create or replace function public.score_section(p_attempt_id uuid, p_lbe_level int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_owner   uuid;
  v_exam    uuid;
  v_correct int;
  v_total   int;
begin
  select user_id, exam_id into v_owner, v_exam
    from public.attempts where id = p_attempt_id;

  if v_owner is null then
    raise exception 'attempt_not_found' using errcode = 'P0001';
  end if;
  -- Only the attempt owner (or an admin) may trigger scoring. Grading itself is
  -- authoritative here (computed from answer_key), not from client input.
  if v_uid is null or (v_uid <> v_owner and not public.is_admin()) then
    raise exception 'not_authorized' using errcode = 'P0001';
  end if;

  -- Grade the selection responses in this section.
  update public.responses r
     set is_correct = (
           (r.answer ->> 'selected') is not null
           and (r.answer ->> 'selected') = (i.answer_key ->> 'correct')
         ),
         score = case
           when (r.answer ->> 'selected') is not null
             and (r.answer ->> 'selected') = (i.answer_key ->> 'correct')
           then 1 else 0
         end,
         graded_by = 'auto',
         graded_at = now()
    from public.items i
   where r.item_id = i.id
     and r.attempt_id = p_attempt_id
     and i.lbe_level = p_lbe_level
     and i.question_type in (1, 2);

  -- Total auto-gradable items in the section (unanswered ones count toward the
  -- denominator but not the correct tally).
  select count(*) into v_total
    from public.items i
   where i.exam_id = v_exam
     and i.lbe_level = p_lbe_level
     and i.question_type in (1, 2)
     and i.active;

  -- Correct auto-graded answers in the section.
  select count(*) into v_correct
    from public.responses r
    join public.items i on i.id = r.item_id
   where r.attempt_id = p_attempt_id
     and i.lbe_level = p_lbe_level
     and i.question_type in (1, 2)
     and r.is_correct is true;

  insert into public.section_scores
      (attempt_id, lbe_level, auto_correct_count, auto_total, updated_at)
  values (p_attempt_id, p_lbe_level, coalesce(v_correct, 0), coalesce(v_total, 0), now())
  on conflict (attempt_id, lbe_level) do update
    set auto_correct_count = excluded.auto_correct_count,
        auto_total         = excluded.auto_total,
        updated_at         = now();
end;
$$;

revoke all on function public.score_section(uuid, int) from public;
grant execute on function public.score_section(uuid, int) to authenticated;

-- -----------------------------------------------------------------------------
-- score_attempt(): score every section of an attempt (safety net on submit)
-- -----------------------------------------------------------------------------
create or replace function public.score_attempt(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_owner uuid;
  v_exam  uuid;
  v_lvl   int;
begin
  select user_id, exam_id into v_owner, v_exam
    from public.attempts where id = p_attempt_id;

  if v_owner is null then
    raise exception 'attempt_not_found' using errcode = 'P0001';
  end if;
  if v_uid is null or (v_uid <> v_owner and not public.is_admin()) then
    raise exception 'not_authorized' using errcode = 'P0001';
  end if;

  for v_lvl in
    select distinct i.lbe_level
      from public.items i
     where i.exam_id = v_exam
       and i.question_type in (1, 2)
       and i.active
     order by i.lbe_level
  loop
    perform public.score_section(p_attempt_id, v_lvl);
  end loop;
end;
$$;

revoke all on function public.score_attempt(uuid) from public;
grant execute on function public.score_attempt(uuid) to authenticated;

-- =============================================================================
-- End of migration.
-- =============================================================================
