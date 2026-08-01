-- 0025_training.sql
--
-- LBE Training section: a Course tab (admin-managed recorded sessions) and a
-- Material tab (text/interactive lessons). Ships two tables:
--
--   course_lessons     — recorded-session entries an admin curates (title, link,
--                        etc.), shown on the candidate Course tab.
--   intro_submissions  — one saved "Introduce Yourself" submission per candidate
--                        (Material · Lesson 1), so they can revisit/edit and
--                        regenerate the AI-written intro later.
--
-- Access to Training is gated in the app by "has redeemed any exam access code"
-- (see lib/training/entitlement) — there is no separate study-material code.

-- -----------------------------------------------------------------------------
-- course_lessons — recorded sessions (Course tab). Admin-managed content.
-- -----------------------------------------------------------------------------
create table if not exists public.course_lessons (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  video_url        text,
  duration_minutes int,
  position         int  not null default 0,
  published        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_course_lessons_order
  on public.course_lessons (position, created_at);

alter table public.course_lessons enable row level security;

-- Staff manage everything. Candidates never read this table directly — the
-- candidate Course tab loads published rows via the service role after the
-- app-level entitlement check (same pattern as exam items), so paid video links
-- aren't exposed by RLS.
drop policy if exists course_lessons_staff_all on public.course_lessons;
create policy course_lessons_staff_all on public.course_lessons
  for all using (public.is_admin() or public.is_grader())
  with check (public.is_admin() or public.is_grader());

-- -----------------------------------------------------------------------------
-- intro_submissions — Material · Lesson 1 "Introduce Yourself".
-- One row per candidate (upserted), so they can come back and edit/regenerate.
-- -----------------------------------------------------------------------------
create table if not exists public.intro_submissions (
  user_id          uuid primary key references public.profiles (id) on delete cascade,
  name             text,
  date_of_birth    date,
  city             text,
  education        text,
  current_status   text,
  previous_job     text,
  field            text,
  experience_areas text[] not null default '{}',
  soft_skills      text[] not null default '{}',
  qualifications   text[] not null default '{}',
  career_goal      text,
  key_achievement  text,
  languages        text,
  weaknesses       text[] not null default '{}',
  tone             text not null default 'friendly',
  generated_text   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.intro_submissions enable row level security;

-- A candidate reads/writes only their own row; staff may read all.
drop policy if exists intro_submissions_own on public.intro_submissions;
create policy intro_submissions_own on public.intro_submissions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists intro_submissions_staff_read on public.intro_submissions;
create policy intro_submissions_staff_read on public.intro_submissions
  for select using (public.is_admin() or public.is_grader());

-- =============================================================================
-- End of migration.
-- =============================================================================
