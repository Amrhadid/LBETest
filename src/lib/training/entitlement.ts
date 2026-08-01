/**
 * Training entitlement. Access to the LBE Training section (Course + Material)
 * is unlocked once a candidate has redeemed any exam access code — there is no
 * separate study-material code. SERVER-safe (takes a Supabase client).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** True if this user has at least one redeemed ("used") access code. */
export async function hasTrainingAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { count } = await supabase
    .from("access_codes")
    .select("id", { count: "exact", head: true })
    .eq("redeemed_by", userId)
    .eq("status", "used");
  return (count ?? 0) > 0;
}
