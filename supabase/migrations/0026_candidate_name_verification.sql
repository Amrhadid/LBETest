-- Candidate legal-name verification.
--
-- Candidates confirm, during onboarding, that their full name matches their
-- national ID / passport. An admin then reviews and approves (or corrects) the
-- name so it prints correctly on the certificate. This mirrors the existing
-- certificate-photo approval flow (0022): a plain text status column gated by a
-- named CHECK constraint, set by the service role / admin only — never by the
-- candidate directly.

alter table public.profiles
  add column if not exists name_status      text,        -- null | 'pending' | 'approved' | 'rejected'
  add column if not exists name_reviewed_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_name_status_chk;
alter table public.profiles
  add constraint profiles_name_status_chk
  check (name_status is null
         or name_status in ('pending', 'approved', 'rejected'));

-- Onboarding now stamps the name as 'pending' review when the candidate submits
-- (and confirms it matches their ID). Same signature as 0024 so callers are
-- unchanged; the only addition is `name_status = 'pending'` on the UPDATE.
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
    onboarded_at      = now(),
    name_status       = 'pending',
    name_reviewed_at  = null
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
