-- 0023_lock_approved_certificate_photo.sql
-- Passport-photo rule: once a certificate photo is APPROVED it is locked forever.
--
-- Candidates hold a direct column UPDATE grant on certificate_photo_path, so a
-- candidate (or any upstream code that forgets the check) could otherwise swap
-- the image AFTER approval — leaving an unvetted photo on an official, approved,
-- verifiable certificate. This BEFORE UPDATE trigger enforces the lock in the
-- database: while a row's existing status is 'approved', neither the photo path
-- nor the photo status may change. All OTHER profile columns remain editable.
--
-- Requires 0022 (certificate_photo_path / certificate_photo_status columns).

create or replace function public.lock_approved_certificate_photo()
returns trigger
language plpgsql
as $$
begin
  if old.certificate_photo_status = 'approved'
     and (new.certificate_photo_path   is distinct from old.certificate_photo_path
       or new.certificate_photo_status is distinct from old.certificate_photo_status)
  then
    raise exception
      'certificate photo is approved and locked; no further changes are allowed'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lock_approved_certificate_photo on public.profiles;
create trigger trg_lock_approved_certificate_photo
  before update on public.profiles
  for each row
  execute function public.lock_approved_certificate_photo();

-- Note: the lock applies to EVERYONE, including the service role — an approved
-- photo cannot be changed by app code either. To deliberately override (e.g. an
-- erroneous approval), an admin must disable this trigger in the database first.
