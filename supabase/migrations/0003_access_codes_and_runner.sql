-- =============================================================================
-- LBET exam runner — access codes + runner support
-- =============================================================================
-- Idempotent: safe to run multiple times in the Supabase SQL editor.
--
--   1. access_codes table — the SOLE entitlement mechanism (no payment gateway).
--      Admin generates codes; a candidate redeems one to unlock the exam.
--   2. redeem_access_code(text) — atomic, safe redemption.
--   3. attempts.access_code_id — link an attempt to the code that unlocked it.
--   4. responses unique(attempt_id, item_id) — enables autosave upserts.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. access_codes
-- -----------------------------------------------------------------------------
create table if not exists public.access_codes (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  exam_id         uuid references public.exams (id) on delete cascade,
  status          text not null default 'unused'
                  check (status in ('unused','used','revoked')),
  assigned_org_id uuid references public.organizations (id) on delete set null,
  redeemed_by     uuid references public.profiles (id) on delete set null,
  redeemed_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_access_codes_redeemed_by on public.access_codes (redeemed_by);
create index if not exists idx_access_codes_exam on public.access_codes (exam_id);

alter table public.access_codes enable row level security;

-- Admins manage the full lifecycle (generation, revocation).
drop policy if exists access_codes_admin_all on public.access_codes;
create policy access_codes_admin_all on public.access_codes
  for all using (public.is_admin()) with check (public.is_admin());

-- A candidate may read only codes they have already redeemed (to check
-- entitlement). Redemption itself goes through redeem_access_code() below,
-- which runs as SECURITY DEFINER and performs the atomic status flip.
drop policy if exists access_codes_select_own on public.access_codes;
create policy access_codes_select_own on public.access_codes
  for select using (redeemed_by = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- 2. redeem_access_code(): atomic redemption
-- -----------------------------------------------------------------------------
-- Only flips 'unused' -> 'used' (race-safe via the WHERE clause). Sets the
-- redeemer to the caller. Raises a distinguishable error otherwise.
create or replace function public.redeem_access_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  update public.access_codes
     set status = 'used',
         redeemed_by = v_uid,
         redeemed_at = now()
   where code = p_code
     and status = 'unused'
  returning id into v_id;

  if v_id is null then
    if not exists (select 1 from public.access_codes where code = p_code) then
      raise exception 'invalid_code' using errcode = 'P0001';
    else
      raise exception 'code_not_available' using errcode = 'P0001';
    end if;
  end if;

  return v_id;
end;
$$;

revoke all on function public.redeem_access_code(text) from public;
grant execute on function public.redeem_access_code(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. attempts.access_code_id
-- -----------------------------------------------------------------------------
alter table public.attempts
  add column if not exists access_code_id uuid
    references public.access_codes (id) on delete set null;

-- -----------------------------------------------------------------------------
-- 4. responses unique(attempt_id, item_id) for autosave upserts
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'responses_attempt_item_unique'
  ) then
    alter table public.responses
      add constraint responses_attempt_item_unique unique (attempt_id, item_id);
  end if;
end $$;

-- =============================================================================
-- End of migration.
-- =============================================================================
