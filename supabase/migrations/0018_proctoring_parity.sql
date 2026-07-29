-- 0018_proctoring_parity.sql
-- Full-proctoring-parity signals: ID/selfie verification, continuous webcam/mic/
-- screen recording, AI face + speaker signals, human-review workflow, and an
-- admin audit log. All admin-only. Candidate storage access is locked to their
-- own path (first segment = user id), same convention as responses-audio.

-- ---------------------------------------------------------------------------
-- attempts: new proctoring columns
-- ---------------------------------------------------------------------------
alter table public.attempts
  -- ID + selfie verification (#1)
  add column if not exists id_verified     boolean not null default false,
  add column if not exists id_image_path   text,
  add column if not exists selfie_path      text,
  -- Continuous recording presence flags (#2/#3/#4) — chunks live in the
  -- attempt-recordings bucket under <user>/<attempt>/{webcam,mic,screen}/.
  add column if not exists has_webcam_rec   boolean not null default false,
  add column if not exists has_mic_rec      boolean not null default false,
  add column if not exists has_screen_rec   boolean not null default false,
  -- AI signals (#5/#6)
  add column if not exists no_face_count    integer not null default 0,
  add column if not exists multi_face_count integer not null default 0,
  add column if not exists multi_speaker    boolean not null default false,
  -- Human review workflow (#8)
  add column if not exists review_status    text,   -- null | 'cleared' | 'confirmed_violation'
  add column if not exists review_note      text,
  add column if not exists reviewed_by      text,
  add column if not exists reviewed_at      timestamptz;

alter table public.attempts
  drop constraint if exists attempts_review_status_chk;
alter table public.attempts
  add constraint attempts_review_status_chk
  check (review_status is null or review_status in ('cleared', 'confirmed_violation'));

-- ---------------------------------------------------------------------------
-- audit_log: key admin actions (#9). Service-role writes/reads only.
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid,
  actor_email text,
  action      text not null,
  target_type text,
  target_id   text,
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;
-- No policies for authenticated/anon → only the service role (which bypasses
-- RLS) can read or write. Admin pages read it via the service-role client.
revoke all on public.audit_log from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Private buckets: ID/selfie images and continuous recordings.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('id-verification',   'id-verification',   false),
  ('attempt-recordings','attempt-recordings',false)
on conflict (id) do nothing;

-- Candidates may upload + read back ONLY their own objects (path[1] = user id).
do $$
declare b text;
begin
  foreach b in array array['id-verification','attempt-recordings'] loop
    execute format('drop policy if exists %I on storage.objects', b || '_insert_own');
    execute format($f$
      create policy %I on storage.objects for insert to authenticated
      with check (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text)
    $f$, b || '_insert_own', b);

    execute format('drop policy if exists %I on storage.objects', b || '_read_own');
    execute format($f$
      create policy %I on storage.objects for select to authenticated
      using (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text)
    $f$, b || '_read_own', b);
  end loop;
end $$;

-- Admins/staff read images + recordings via the service role (signed URLs),
-- which bypasses RLS, so no staff SELECT policy is needed here.
