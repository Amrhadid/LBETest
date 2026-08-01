import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { EMPTY_INTRO, type IntroData } from "@/lib/training/intro";
import { IntroduceYourself } from "@/app/training/material/introduce-yourself/IntroduceYourself";

export const dynamic = "force-dynamic";

/** Load any saved submission so the candidate can edit + regenerate. */
export default async function IntroduceYourselfPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/training/material/introduce-yourself");

  const { data: row } = await supabase
    .from("intro_submissions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const initial: IntroData = row
    ? {
        name: row.name ?? "",
        date_of_birth: row.date_of_birth ?? "",
        city: row.city ?? "",
        education: row.education ?? "",
        current_status: row.current_status ?? "",
        previous_job: row.previous_job ?? "",
        field: row.field ?? "",
        experience_areas: row.experience_areas ?? [],
        soft_skills: row.soft_skills ?? [],
        qualifications: row.qualifications ?? [],
        career_goal: row.career_goal ?? "",
        key_achievement: row.key_achievement ?? "",
        languages: row.languages ?? "",
        weaknesses: row.weaknesses ?? [],
        tone: row.tone ?? "friendly",
      }
    : { ...EMPTY_INTRO, name: "" };

  return (
    <div>
      <Link
        href="/training/material"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gold underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" /> Material
      </Link>
      <p className="text-xs font-semibold uppercase tracking-wide text-gold">
        Lesson 1
      </p>
      <h2 className="font-serif-display mt-1 text-3xl text-charcoal">
        Introduce Yourself
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Fill in your details and we&rsquo;ll craft a natural self-introduction
        you can use in interviews and at work. Everything is saved to your
        account, so you can come back to edit and regenerate.
      </p>

      <div className="mt-8">
        <IntroduceYourself initial={initial} savedText={row?.generated_text ?? null} />
      </div>
    </div>
  );
}
