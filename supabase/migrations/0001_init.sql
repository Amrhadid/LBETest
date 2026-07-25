-- =============================================================================
-- LBET (Locrativ Business English Test) — initial schema
-- =============================================================================
-- Idempotent migration: safe to run multiple times in the Supabase SQL editor.
-- Creates the core tables, an auto-profile trigger, a role helper, and Row
-- Level Security policies for every table.
--
-- Conventions:
--   * `create table if not exists` + `create ... if not exists` guards.
--   * Policies are dropped-then-created so re-running picks up edits.
--   * All timestamps are timestamptz defaulting to now().
-- =============================================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- -----------------------------------------------------------------------------
-- profiles: one row per auth user (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       text not null default 'candidate'
             check (role in (
               'candidate','company_admin','company_member','institution_admin',
               'teacher','grader','admin','super_admin'
             )),
  locale     text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- organizations: companies and institutions
-- -----------------------------------------------------------------------------
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  type        text check (type in ('company','institution')),
  name        text,
  plan        text,
  seats_total int not null default 0,
  seats_used  int not null default 0,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- memberships: which users belong to which orgs
-- -----------------------------------------------------------------------------
create table if not exists public.memberships (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  org_id     uuid not null references public.organizations (id) on delete cascade,
  role       text,
  status     text,
  created_at timestamptz not null default now(),
  unique (user_id, org_id)
);

-- -----------------------------------------------------------------------------
-- exams: exam definitions
-- -----------------------------------------------------------------------------
create table if not exists public.exams (
  id         uuid primary key default gen_random_uuid(),
  code       text,
  title      text,
  version    int,
  status     text not null default 'draft',
  config     jsonb,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- items: individual questions / passages that make up exams
-- -----------------------------------------------------------------------------
create table if not exists public.items (
  id            uuid primary key default gen_random_uuid(),
  exam_id       uuid references public.exams (id) on delete cascade,
  source_type   text check (source_type in (
                  'article','dialogue','email','script','situation','audio'
                )),
  question_type int check (question_type between 1 and 5),
  lbe_level     int check (lbe_level between 1 and 5),
  prompt        text,
  media_url     text,
  options       jsonb,
  answer_key    jsonb,
  rubric        jsonb,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- forms: ordered selections of items assembled into a deliverable test form
-- -----------------------------------------------------------------------------
create table if not exists public.forms (
  id         uuid primary key default gen_random_uuid(),
  exam_id    uuid references public.exams (id) on delete cascade,
  label      text,
  item_ids   uuid[],
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- attempts: a candidate's sitting of an exam form
-- -----------------------------------------------------------------------------
create table if not exists public.attempts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  exam_id           uuid references public.exams (id) on delete set null,
  form_id           uuid references public.forms (id) on delete set null,
  org_id            uuid references public.organizations (id) on delete set null,
  status            text not null default 'in_progress',
  started_at        timestamptz,
  submitted_at      timestamptz,
  provisional_score numeric,
  final_score       numeric,
  lbe_level         int,
  created_at        timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- responses: a candidate's answer to a single item within an attempt
-- -----------------------------------------------------------------------------
create table if not exists public.responses (
  id         uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  item_id    uuid references public.items (id) on delete set null,
  answer     jsonb,
  is_correct boolean,
  score      numeric,
  graded_by  text,
  graded_at  timestamptz,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- attempt_events: audit/telemetry stream for an attempt (focus loss, etc.)
-- -----------------------------------------------------------------------------
create table if not exists public.attempt_events (
  id         uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  type       text,
  payload    jsonb,
  at         timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- certificates: issued, verifiable credentials
-- -----------------------------------------------------------------------------
create table if not exists public.certificates (
  id         uuid primary key default gen_random_uuid(),
  cert_code  text unique not null,
  attempt_id uuid references public.attempts (id) on delete set null,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  lbe_level  int,
  score      numeric,
  issued_at  timestamptz,
  expires_at timestamptz,
  status     text not null default 'valid'
             check (status in ('valid','expired','revoked')),
  issue_hash text,
  pdf_url    text
);

-- Helpful indexes for the RLS predicates and common lookups.
create index if not exists idx_memberships_user       on public.memberships (user_id);
create index if not exists idx_memberships_org         on public.memberships (org_id);
create index if not exists idx_attempts_user           on public.attempts (user_id);
create index if not exists idx_attempts_org            on public.attempts (org_id);
create index if not exists idx_responses_attempt       on public.responses (attempt_id);
create index if not exists idx_attempt_events_attempt  on public.attempt_events (attempt_id);
create index if not exists idx_certificates_user       on public.certificates (user_id);
create index if not exists idx_items_exam              on public.items (exam_id);
create index if not exists idx_forms_exam              on public.forms (exam_id);

-- =============================================================================
-- Auto-profile trigger: insert a profile row when a new auth user signs up.
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'locale'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Role helper: read the caller's role from profiles. SECURITY DEFINER so the
-- policies can consult profiles without recursing through profiles' own RLS.
-- =============================================================================
create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Is the caller a platform-wide admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() in ('admin','super_admin');
$$;

-- Is the caller allowed to grade responses?
create or replace function public.is_grader()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() in ('grader','teacher','admin','super_admin');
$$;

-- Is the caller authenticated staff (any non-candidate role)? Used to gate
-- read access to exam content.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() in (
    'company_admin','company_member','institution_admin',
    'teacher','grader','admin','super_admin'
  );
$$;

-- Org ids where the caller is an admin-type member (used for org-scoped reads).
create or replace function public.admin_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id
  from public.memberships
  where user_id = auth.uid()
    and role in ('company_admin','institution_admin','admin','owner');
$$;

-- Org ids where the caller is any member.
create or replace function public.member_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.memberships where user_id = auth.uid();
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles      enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships   enable row level security;
alter table public.exams         enable row level security;
alter table public.items         enable row level security;
alter table public.forms         enable row level security;
alter table public.attempts      enable row level security;
alter table public.responses     enable row level security;
alter table public.attempt_events enable row level security;
alter table public.certificates  enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: users see/update only their own row; admins do all.
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- organizations: members see only their own org; admins do all.
-- ---------------------------------------------------------------------------
drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member on public.organizations
  for select using (id in (select public.member_org_ids()) or public.is_admin());

drop policy if exists organizations_admin_all on public.organizations;
create policy organizations_admin_all on public.organizations
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- memberships: a user sees their own memberships; org admins see their org's
-- rows; platform admins do all.
-- ---------------------------------------------------------------------------
drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships
  for select using (
    user_id = auth.uid()
    or org_id in (select public.admin_org_ids())
    or public.is_admin()
  );

drop policy if exists memberships_admin_all on public.memberships;
create policy memberships_admin_all on public.memberships
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- exams / items / forms: readable by authenticated staff; writable only by
-- admin/super_admin.
-- ---------------------------------------------------------------------------
drop policy if exists exams_select_staff on public.exams;
create policy exams_select_staff on public.exams
  for select using (public.is_staff() or public.is_admin());

drop policy if exists exams_admin_write on public.exams;
create policy exams_admin_write on public.exams
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists items_select_staff on public.items;
create policy items_select_staff on public.items
  for select using (public.is_staff() or public.is_admin());

drop policy if exists items_admin_write on public.items;
create policy items_admin_write on public.items
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists forms_select_staff on public.forms;
create policy forms_select_staff on public.forms
  for select using (public.is_staff() or public.is_admin());

drop policy if exists forms_admin_write on public.forms;
create policy forms_admin_write on public.forms
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- attempts: a user sees/creates their own; org admins see their org's members'
-- attempts; graders and admins see all.
-- ---------------------------------------------------------------------------
drop policy if exists attempts_select on public.attempts;
create policy attempts_select on public.attempts
  for select using (
    user_id = auth.uid()
    or org_id in (select public.admin_org_ids())
    or public.is_grader()
    or public.is_admin()
  );

drop policy if exists attempts_insert_own on public.attempts;
create policy attempts_insert_own on public.attempts
  for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists attempts_update_own on public.attempts;
create policy attempts_update_own on public.attempts
  for update using (
    user_id = auth.uid() or public.is_grader() or public.is_admin()
  )
  with check (
    user_id = auth.uid() or public.is_grader() or public.is_admin()
  );

drop policy if exists attempts_admin_all on public.attempts;
create policy attempts_admin_all on public.attempts
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- responses: visibility follows the parent attempt. Owners can insert/update
-- their own responses; graders can grade; admins do all.
-- ---------------------------------------------------------------------------
drop policy if exists responses_select on public.responses;
create policy responses_select on public.responses
  for select using (
    exists (
      select 1 from public.attempts a
      where a.id = responses.attempt_id
        and (
          a.user_id = auth.uid()
          or a.org_id in (select public.admin_org_ids())
        )
    )
    or public.is_grader()
    or public.is_admin()
  );

drop policy if exists responses_insert_own on public.responses;
create policy responses_insert_own on public.responses
  for insert with check (
    exists (
      select 1 from public.attempts a
      where a.id = responses.attempt_id and a.user_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists responses_update on public.responses;
create policy responses_update on public.responses
  for update using (
    exists (
      select 1 from public.attempts a
      where a.id = responses.attempt_id and a.user_id = auth.uid()
    )
    or public.is_grader()
    or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.attempts a
      where a.id = responses.attempt_id and a.user_id = auth.uid()
    )
    or public.is_grader()
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- attempt_events: same visibility as the parent attempt; the owner can append.
-- ---------------------------------------------------------------------------
drop policy if exists attempt_events_select on public.attempt_events;
create policy attempt_events_select on public.attempt_events
  for select using (
    exists (
      select 1 from public.attempts a
      where a.id = attempt_events.attempt_id
        and (
          a.user_id = auth.uid()
          or a.org_id in (select public.admin_org_ids())
        )
    )
    or public.is_grader()
    or public.is_admin()
  );

drop policy if exists attempt_events_insert_own on public.attempt_events;
create policy attempt_events_insert_own on public.attempt_events
  for insert with check (
    exists (
      select 1 from public.attempts a
      where a.id = attempt_events.attempt_id and a.user_id = auth.uid()
    )
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- certificates: a user sees their own; org admins see their org's members';
-- graders/admins see all. Writes are admin-only (issued by trusted server).
-- ---------------------------------------------------------------------------
drop policy if exists certificates_select on public.certificates;
create policy certificates_select on public.certificates
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.attempts a
      where a.id = certificates.attempt_id
        and a.org_id in (select public.admin_org_ids())
    )
    or public.is_grader()
    or public.is_admin()
  );

drop policy if exists certificates_admin_write on public.certificates;
create policy certificates_admin_write on public.certificates
  for all using (public.is_admin()) with check (public.is_admin());

-- =============================================================================
-- End of migration.
-- =============================================================================
