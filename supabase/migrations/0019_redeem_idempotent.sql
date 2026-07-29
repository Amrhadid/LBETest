-- 0019_redeem_idempotent.sql
-- Make redeem_access_code idempotent for the SAME user.
--
-- Before: a retried Server Action / double-submit ran the redeem twice; the
-- second run found the code already 'used' and raised 'code_not_available',
-- surfacing a false "already used" error even though the first run had already
-- redeemed the code FOR THIS USER. After: if the code is already used by the
-- calling user, return its id (success) instead of raising. A code used by a
-- DIFFERENT user still correctly raises 'code_not_available'.

create or replace function public.redeem_access_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
  v_owner uuid;
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
    -- Nothing flipped. Distinguish the three cases.
    select id, redeemed_by into v_id, v_owner
      from public.access_codes
     where code = p_code;

    if v_id is null then
      raise exception 'invalid_code' using errcode = 'P0001';
    elsif v_owner = v_uid then
      -- Already redeemed by THIS user (retry / double-submit): treat as success.
      return v_id;
    else
      raise exception 'code_not_available' using errcode = 'P0001';
    end if;
  end if;

  return v_id;
end;
$$;

-- Grants are unchanged (authenticated only); re-assert to be safe.
revoke all on function public.redeem_access_code(text) from public;
revoke execute on function public.redeem_access_code(text) from anon;
grant execute on function public.redeem_access_code(text) to authenticated;
