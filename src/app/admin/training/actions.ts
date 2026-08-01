"use server";

import { revalidatePath } from "next/cache";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { writeAudit } from "@/lib/exam/audit.server";

export type CourseActionState = { error?: string; message?: string };

function parseNum(v: FormDataEntryValue | null): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

/** Create or update a recorded-session lesson (Course tab). Admin-only. */
export async function saveCourseLesson(
  _prev: CourseActionState,
  formData: FormData,
): Promise<CourseActionState> {
  const admin = await requireAdmin();
  const svc = createServiceRoleClient();

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "A title is required." };

  const row = {
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    video_url: String(formData.get("video_url") ?? "").trim() || null,
    duration_minutes: parseNum(formData.get("duration_minutes")),
    position: parseNum(formData.get("position")) ?? 0,
    published: formData.get("published") === "on",
    updated_at: new Date().toISOString(),
  };

  const { error } = id
    ? await svc.from("course_lessons").update(row).eq("id", id)
    : await svc.from("course_lessons").insert(row);
  if (error) return { error: "Could not save the lesson. Please try again." };

  await writeAudit(
    { id: admin.id, email: admin.email },
    { action: id ? "course.update" : "course.create", targetType: "course_lesson", targetId: id || title, detail: { title } },
  );
  revalidatePath("/admin/training");
  revalidatePath("/training/course");
  return { message: id ? "Lesson updated." : "Lesson added." };
}

/** Toggle a lesson's published state. Admin-only. */
export async function toggleCoursePublished(
  id: string,
  published: boolean,
): Promise<CourseActionState> {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const { error } = await svc
    .from("course_lessons")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Could not update." };
  revalidatePath("/admin/training");
  revalidatePath("/training/course");
  return { message: published ? "Published." : "Unpublished." };
}

/** Delete a lesson. Admin-only. */
export async function deleteCourseLesson(id: string): Promise<CourseActionState> {
  const admin = await requireAdmin();
  const svc = createServiceRoleClient();
  const { error } = await svc.from("course_lessons").delete().eq("id", id);
  if (error) return { error: "Could not delete." };
  await writeAudit(
    { id: admin.id, email: admin.email },
    { action: "course.delete", targetType: "course_lesson", targetId: id, detail: {} },
  );
  revalidatePath("/admin/training");
  revalidatePath("/training/course");
  return { message: "Deleted." };
}
