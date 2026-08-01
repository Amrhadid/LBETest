import Link from "next/link";
import { PlayCircle, Clock } from "lucide-react";

import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Course tab — published recorded sessions. Loaded via the service role after
 * the layout's entitlement gate (course_lessons is staff-only under RLS, so paid
 * video links aren't exposed).
 */
export default async function CourseTab() {
  const svc = createServiceRoleClient();
  const { data: lessons } = await svc
    .from("course_lessons")
    .select("id, title, description, video_url, duration_minutes")
    .eq("published", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (!lessons || lessons.length === 0) {
    return (
      <p className="text-muted-foreground">
        No recorded sessions have been published yet. Check back soon.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {lessons.map((l) => (
        <div
          key={l.id}
          className="rounded-2xl border border-gold/25 bg-card p-5 shadow-card"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-charcoal">{l.title}</h3>
              {l.description && (
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {l.description}
                </p>
              )}
              {l.duration_minutes != null && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" /> {l.duration_minutes} min
                </p>
              )}
            </div>
            {l.video_url && (
              <Link
                href={l.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <PlayCircle className="size-4" /> Watch
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
