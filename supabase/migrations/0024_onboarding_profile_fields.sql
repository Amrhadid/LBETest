-- 0024_onboarding_profile_fields.sql
--
-- First-time onboarding for candidates. After a user signs up with Google we
-- collect a small profile before they can use the site: name, date of birth,
-- current job (or, if none, a target job), purpose of visiting, and country of
-- origin. These live on public.profiles and are written by a SECURITY DEFINER
-- RPC (save_onboarding) so the candidate can set only these fields on their own
-- row — never role or other columns — and onboarded_at gates the flow.

alter table public.profiles
  add column if not exists date_of_birth     date,
  add column if not exists current_job       text,
  add column if not exists target_job        text,
  add column if not exists visit_purpose     text,
  add column if not exists country_of_origin text,
  add column if not exists onboarded_at      timestamptz;

alter table public.profiles
  drop constraint if exists profiles_visit_purpose_check;
alter table public.profiles
  add constraint profiles_visit_purpose_check
  check (
    visit_purpose is null
    or visit_purpose in ('learn', 'lbe_exam', 'test_employees')
  );

comment on column public.profiles.date_of_birth is
  'Candidate date of birth, collected at onboarding.';
comment on column public.profiles.current_job is
  'Candidate current job title; NULL when they selected "no job" (see target_job).';
comment on column public.profiles.target_job is
  'The job the candidate is aiming for; collected when they have no current job.';
comment on column public.profiles.visit_purpose is
  'Why the candidate is here: learn | lbe_exam | test_employees.';
comment on column public.profiles.country_of_origin is
  'Candidate country of origin (name), collected at onboarding.';
comment on column public.profiles.onboarded_at is
  'When the candidate completed first-time onboarding. NULL = not yet onboarded.';

-- -----------------------------------------------------------------------------
-- save_onboarding — a candidate fills in their own onboarding profile.
-- SECURITY DEFINER so it can write the profile row regardless of column grants,
-- but it only ever touches auth.uid()'s own row and only the onboarding fields.
-- -----------------------------------------------------------------------------
create or replace function public.save_onboarding(
  p_full_name         text,
  p_date_of_birth     date,
  p_current_job       text,
  p_target_job        text,
  p_visit_purpose     text,
  p_country_of_origin text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    raise exception 'name is required';
  end if;
  if p_date_of_birth is null then
    raise exception 'date of birth is required';
  end if;
  if p_date_of_birth > current_date then
    raise exception 'date of birth cannot be in the future';
  end if;
  if p_visit_purpose is null
     or p_visit_purpose not in ('learn', 'lbe_exam', 'test_employees') then
    raise exception 'invalid purpose';
  end if;
  if coalesce(trim(p_country_of_origin), '') = '' then
    raise exception 'country of origin is required';
  end if;
  -- Either a current job or a target job must be provided.
  if coalesce(trim(p_current_job), '') = ''
     and coalesce(trim(p_target_job), '') = '' then
    raise exception 'a current job or a target job is required';
  end if;

  update public.profiles set
    full_name         = trim(p_full_name),
    date_of_birth     = p_date_of_birth,
    current_job       = nullif(trim(p_current_job), ''),
    target_job        = nullif(trim(p_target_job), ''),
    visit_purpose     = p_visit_purpose,
    country_of_origin = trim(p_country_of_origin),
    onboarded_at      = now()
  where id = v_uid;

  if not found then
    raise exception 'profile % not found', v_uid;
  end if;
end;
$$;

revoke all on function public.save_onboarding(text, date, text, text, text, text)
  from public, anon;
grant execute on function public.save_onboarding(text, date, text, text, text, text)
  to authenticated;

-- =============================================================================
-- End of migration.
-- =============================================================================
