-- 0017_exam_credibility.sql
-- Exam-credibility signals on attempts + a private bucket for room-scan clips.
--
-- Adds the columns the trust-scoring pipeline (src/lib/exam/trust*.ts) writes
-- and reads: a composite suspicion score + its per-signal breakdown, plus the
-- raw signals gathered at attempt start (network/geo, device fingerprint,
-- room-scan object path, and a violation counter). All admin-only — none of
-- these are ever exposed to the candidate.
--
-- Higher trust_score = MORE suspicious (0 = clean, 100 = maxed out).

alter table public.attempts
  add column if not exists trust_score     numeric,
  add column if not exists trust_breakdown jsonb,
  add column if not exists country         text,
  add column if not exists network         text,
  add column if not exists asn             text,
  add column if not exists is_datacenter   boolean not null default false,
  add column if not exists fingerprint     text,
  add column if not exists room_scan_path  text,
  add column if not exists violation_count integer not null default 0;

-- Fast lookups: worst-first "Flagged" admin view, and shared-fingerprint checks.
create index if not exists attempts_trust_score_idx
  on public.attempts (trust_score desc nulls last);
create index if not exists attempts_fingerprint_idx
  on public.attempts (fingerprint)
  where fingerprint is not null;

-- These columns are service-role only. Candidates already have no UPDATE grant
-- on attempts (status transitions go through submit_attempt), so no column-level
-- GRANT changes are needed — RLS + the existing grants keep them invisible.

-- ---------------------------------------------------------------------------
-- Private bucket for pre-exam room-scan clips (a few seconds of webcam video).
-- Same ownership convention as responses-audio: first path segment = user id.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('room-scans', 'room-scans', false)
on conflict (id) do nothing;

-- Candidates may upload their OWN room scan (path starts with their user id).
drop policy if exists "room_scans_insert_own" on storage.objects;
create policy "room_scans_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'room-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Candidates may read back their own upload (e.g. to confirm it saved).
drop policy if exists "room_scans_read_own" on storage.objects;
create policy "room_scans_read_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'room-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins/staff read scans via the service role (signed URLs), which bypasses
-- RLS, so no staff SELECT policy is required here.
