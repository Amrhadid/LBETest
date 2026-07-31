-- 0023_lock_approved_certificate_photo.sql
-- Passport-photo rule: once a certificate photo is APPROVED, the CANDIDATE can no
-- longer change it. Admins can still revert/replace/delete it through the app.
--
-- Candidates hold a direct column UPDATE grant on certificate_photo_path, so a
-- candidate could otherwise swap the image AFTER approval — leaving an unvetted
-- photo on an official, approved, verifiable certificate. This BEFORE UPDATE
-- trigger enforces the lock in the database: while a row's existing status is
-- 'approved', a candidate cannot change the photo path or status. All admin
-- actions run through the SERVICE ROLE, which is exempt — so an admin can revert
-- a mistaken approval, replace, or delete the photo from the admin panel.
-- All OTHER profile columns remain editable by candidates regardless.
--
-- Requires 0022 (certificate_photo_path / certificate_photo_status columns).

create or replace function public.lock_approved_certificate_photo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin/app actions use the service role and are always allowed.
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  -- For everyone else (candidates), an approved photo is locked.
  if old.certificate_photo_status = 'approved'
     and (new.certificate_photo_path   is distinct from old.certificate_photo_path
       or new.certificate_photo_status is distinct from old.certificate_photo_status)
  then
    raise exception
      'certificate photo is approved and locked; contact an administrator to change it'
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
