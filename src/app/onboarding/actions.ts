"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { isKnownCountry } from "@/lib/countries";
import { VISIT_PURPOSE_VALUES } from "@/lib/auth/onboarding";

export type OnboardingState = { error?: string };

/** A safe in-app path to return to after onboarding (defaults to /dashboard). */
function safeNext(next: FormDataEntryValue | null): string {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

/**
 * Persist first-time onboarding for the signed-in candidate and send them on.
 *
 * Writes via the save_onboarding RPC (SECURITY DEFINER) so only the caller's own
 * onboarding fields are set — never role or other columns. Validation is echoed
 * here for friendly messages; the RPC enforces it authoritatively too.
 */
export async function submitOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired — please sign in again." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const dob = String(formData.get("date_of_birth") ?? "").trim();
  const hasJob = formData.get("has_job") === "yes";
  const currentJob = String(formData.get("current_job") ?? "").trim();
  const targetJob = String(formData.get("target_job") ?? "").trim();
  const purpose = String(formData.get("visit_purpose") ?? "").trim();
  const country = String(formData.get("country_of_origin") ?? "").trim();
  const nameConfirmed = formData.get("name_confirmed") === "yes";

  if (!fullName) return { error: "Please enter your name." };
  if (!nameConfirmed) {
    return { error: "Please confirm your name matches your national ID or passport." };
  }
  if (!dob) return { error: "Please enter your date of birth." };
  const dobDate = new Date(dob);
  if (Number.isNaN(dobDate.getTime()) || dobDate > new Date()) {
    return { error: "Please enter a valid date of birth." };
  }
  if (!VISIT_PURPOSE_VALUES.includes(purpose as never)) {
    return { error: "Please choose why you're here." };
  }
  if (!country || !isKnownCountry(country)) {
    return { error: "Please choose your country from the list." };
  }
  if (hasJob && !currentJob) return { error: "Please enter your current job." };
  if (!hasJob && !targetJob) return { error: "Please enter your target job." };

  const { error } = await supabase.rpc("save_onboarding", {
    p_full_name: fullName,
    p_date_of_birth: dob,
    p_current_job: hasJob ? currentJob : null,
    p_target_job: hasJob ? null : targetJob,
    p_visit_purpose: purpose,
    p_country_of_origin: country,
  });
  if (error) {
    return { error: "Could not save your details. Please try again." };
  }

  revalidatePath("/dashboard");
  redirect(safeNext(formData.get("next")));
}
