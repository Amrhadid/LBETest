import type { Metadata } from "next";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { AdminHeader } from "@/app/admin/ui";
import { CourseManager, type CourseLesson } from "@/app/admin/training/CourseManager";

export const metadata: Metadata = { title: "Admin — LBE Training" };

export default async function AdminTrainingPage() {
  await requireAdmin();
  const svc = createServiceRoleClient();
  const { data } = await svc
    .from("course_lessons")
    .select("id, title, description, video_url, duration_minutes, position, published")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div>
      <AdminHeader
        eyebrow="Admin"
        title="LBE Training — Course"
        description="Add and manage recorded sessions shown on the candidate Course tab. Only published sessions are visible to candidates."
      />
      <CourseManager lessons={(data ?? []) as CourseLesson[]} />
    </div>
  );
}
