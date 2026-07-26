"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Authentication is Google-only (see AuthForm / GoogleButton). Sign-in and
 * sign-up both happen through Supabase OAuth in the browser, so the only
 * server action needed here is sign-out.
 */

/** Sign the current user out and return to the homepage. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
