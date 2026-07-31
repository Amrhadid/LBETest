-- 0022_certificate_identity_photo.sql
-- Certificate redesign support:
--  - national_id: the candidate's National ID, entered before the exam and
--    printed on the certificate as the "Candidate ID" (stable per account).
--  - certificate_photo_path / _status: an OPTIONAL photo the candidate uploads
--    for their certificate (separate from the ID-check selfie). Only an
--    admin-APPROVED photo is embedded on generated certificates.
--  - a private bucket for those photos.

alter table public.profiles
  add column if not exists national_id              text,
  add column if not exists certificate_photo_path   text,
  add column if not exists certificate_photo_status text; -- null | 'pending' | 'approved' | 'rejected'

alter table public.profiles
  drop constraint if exists profiles_cert_photo_status_chk;
alter table public.profiles
  add constraint profiles_cert_photo_status_chk
  check (certificate_photo_status is null
         or certificate_photo_status in ('pending', 'approved', 'rejected'));

-- Candidates may set their own national_id + certificate photo fields, but NOT
-- the approval status (admins control that via the service role). If a
-- column-level UPDATE grant model is in use (see 0011), grant only these:
grant update (national_id, certificate_photo_path) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Private bucket for certificate photos. Own-path RLS (first segment = user id).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('certificate-photos', 'certificate-photos', false)
on conflict (id) do nothing;

drop policy if exists "cert_photos_insert_own" on storage.objects;
create policy "cert_photos_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'certificate-photos'
              and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "cert_photos_update_own" on storage.objects;
create policy "cert_photos_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'certificate-photos'
         and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "cert_photos_read_own" on storage.objects;
create policy "cert_photos_read_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'certificate-photos'
         and (storage.foldername(name))[1] = auth.uid()::text);

-- Admins read photos for approval via the service role (bypasses RLS).
