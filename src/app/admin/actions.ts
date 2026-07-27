"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin, requireStaff } from "@/lib/admin/guard";
import { ACTIVE_EXAM_ID } from "@/lib/exam/config";
import type { Role } from "@/lib/supabase/types";

export type AdminActionState = { error?: string; message?: string };

// ---------------------------------------------------------------------------
// Preview / reviewer mode (admin or teacher)
// ---------------------------------------------------------------------------

/** Start a preview attempt on the active exam and jump into the real runner. */
export async function startPreviewAttempt(): Promise<void> {
  const user = await requireStaff();
  const svc = createServiceRoleClient();

  // Resume an existing in-progress preview if present, else create one.
  const { data: existing } = await svc
    .from("attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("exam_id", ACTIVE_EXAM_ID)
    .eq("status", "in_progress")
    .eq("is_preview", true)
    .limit(1)
    .maybeSingle();

  if (!existing) {
    await svc.from("attempts").insert({
      user_id: user.id,
      exam_id: ACTIVE_EXAM_ID,
      status: "in_progress",
      is_preview: true,
      started_at: new Date().toISOString(),
    });
  }
  redirect("/start");
}

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------

export async function updateExam(
  id: string,
  fields: { title?: string; version?: number; status?: string },
): Promise<AdminActionState> {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const { error } = await svc
    .from("exams")
    .update({
      ...(fields.title !== undefined ? { title: fields.title } : {}),
      ...(fields.version !== undefined ? { version: fields.version } : {}),
      ...(fields.status !== undefined ? { status: fields.status } : {}),
    })
    .eq("id", id);
  if (error) return { error: "Could not update the exam." };
  revalidatePath("/admin/exams");
  return { message: "Saved." };
}

/** Persist per-section config (time limits/weights) onto exams.config. */
export async function updateExamConfig(
  examId: string,
  config: Record<string, unknown>,
): Promise<AdminActionState> {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const { error } = await svc
    .from("exams")
    .update({ config: config as unknown as never })
    .eq("id", examId);
  if (error) return { error: "Could not save section settings." };
  revalidatePath("/admin/sections");
  return { message: "Saved." };
}

// ---------------------------------------------------------------------------
// Exam Library (items)
// ---------------------------------------------------------------------------

export interface ItemInput {
  id?: string;
  exam_id: string;
  lbe_level: number;
  question_type: number;
  source_type: string | null;
  prompt: string | null;
  options: unknown;
  answer_key: unknown;
  rubric: unknown;
  active: boolean;
}

export async function saveItem(input: ItemInput): Promise<AdminActionState> {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const row = {
    exam_id: input.exam_id,
    lbe_level: input.lbe_level,
    question_type: input.question_type,
    source_type: (input.source_type || null) as never,
    prompt: input.prompt,
    options: (input.options ?? null) as never,
    answer_key: (input.answer_key ?? null) as never,
    rubric: (input.rubric ?? null) as never,
    active: input.active,
  };
  const { error } = input.id
    ? await svc.from("items").update(row).eq("id", input.id)
    : await svc.from("items").insert(row);
  if (error) return { error: `Could not save item: ${error.message}` };
  revalidatePath("/admin/library");
  return { message: "Saved." };
}

export async function setItemActive(
  id: string,
  active: boolean,
): Promise<AdminActionState> {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const { error } = await svc.from("items").update({ active }).eq("id", id);
  if (error) return { error: "Could not update the item." };
  revalidatePath("/admin/library");
  return { message: active ? "Activated." : "Deactivated." };
}

export async function deleteItem(id: string): Promise<AdminActionState> {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const { error } = await svc.from("items").delete().eq("id", id);
  if (error) {
    return {
      error:
        "Could not delete (it may be referenced by existing responses). Try deactivating instead.",
    };
  }
  revalidatePath("/admin/library");
  return { message: "Deleted." };
}

// ---------------------------------------------------------------------------
// Users / roles
// ---------------------------------------------------------------------------

export async function setUserRole(
  userId: string,
  role: Role,
): Promise<AdminActionState> {
  const me = await requireAdmin();
  if (!["candidate", "teacher", "admin"].includes(role)) {
    return { error: "Invalid role." };
  }
  if (userId === me.id && role !== "admin") {
    return { error: "You can't remove your own admin role." };
  }
  const svc = createServiceRoleClient();
  const { error } = await svc.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: "Could not update the role." };
  revalidatePath("/admin/users");
  revalidatePath("/admin/students");
  return { message: "Role updated." };
}

// ---------------------------------------------------------------------------
// Certificates
// ---------------------------------------------------------------------------

export async function setCertificateStatus(
  id: string,
  status: "valid" | "revoked",
): Promise<AdminActionState> {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const { error } = await svc
    .from("certificates")
    .update({ status })
    .eq("id", id);
  if (error) return { error: "Could not update the certificate." };
  revalidatePath("/admin/certificates");
  return { message: status === "revoked" ? "Revoked." : "Reinstated." };
}

// ---------------------------------------------------------------------------
// Access codes
// ---------------------------------------------------------------------------

function makeAccessCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const rand = [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
  return `LBE-${rand.slice(0, 4)}-${rand.slice(4)}`;
}

export async function generateAccessCodes(
  count: number,
): Promise<AdminActionState> {
  await requireAdmin();
  const n = Math.max(1, Math.min(200, Math.floor(count)));
  const svc = createServiceRoleClient();

  // Generate with a couple of retries in case of a rare code collision.
  let created = 0;
  for (let attempt = 0; attempt < 3 && created < n; attempt++) {
    const rows = Array.from({ length: n - created }, () => ({
      code: makeAccessCode(),
      exam_id: ACTIVE_EXAM_ID,
      status: "unused" as const,
    }));
    const { data, error } = await svc
      .from("access_codes")
      .insert(rows)
      .select("id");
    if (!error && data) created += data.length;
    else if (error && !error.message.includes("duplicate")) {
      return { error: "Could not generate codes." };
    }
  }
  revalidatePath("/admin/access-codes");
  return { message: `Generated ${created} code${created === 1 ? "" : "s"}.` };
}

export async function revokeAccessCode(
  id: string,
): Promise<AdminActionState> {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const { error } = await svc
    .from("access_codes")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("status", "unused"); // only unused codes can be revoked
  if (error) return { error: "Could not revoke the code." };
  revalidatePath("/admin/access-codes");
  return { message: "Revoked." };
}
