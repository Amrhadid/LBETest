import type { Metadata } from "next";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { AdminHeader } from "@/app/admin/ui";
import {
  QUESTION_TYPE_LABELS,
  type QuestionType,
} from "@/lib/exam/types";
import { isAiVoiceGraded } from "@/lib/exam/grading";
import {
  AiGradingTester,
  type TestItem,
} from "@/app/admin/ai-grading-test/AiGradingTester";

export const metadata: Metadata = { title: "Admin — AI grading test" };

export default async function AiGradingTestPage() {
  await requireAdmin();
  const svc = createServiceRoleClient();

  const { data: rows } = await svc
    .from("items")
    .select("id, prompt, question_type, lbe_level")
    .in("question_type", [3, 4, 5, 6])
    .eq("active", true)
    .order("lbe_level", { ascending: true });

  const items: TestItem[] = (rows ?? []).map((r) => {
    const qType = r.question_type as QuestionType;
    return {
      id: r.id,
      prompt: r.prompt ?? "(no prompt)",
      questionType: qType,
      questionTypeLabel: QUESTION_TYPE_LABELS[qType] ?? `Type ${qType}`,
      lbeLevel: r.lbe_level ?? null,
      isVoice: isAiVoiceGraded(qType),
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <AdminHeader
        eyebrow="Admin"
        title="AI grading test"
        description="Pick a real exam question, answer it here, and run the exact AI-grading pipeline (speech-to-text for spoken items, then AI grading). Nothing is saved — no attempt, response, or audio is stored."
      />
      <AiGradingTester items={items} />
    </div>
  );
}
