import {
  Headphones,
  BookOpen,
  SpellCheck,
  PenLine,
  Mic,
  type LucideIcon,
} from "lucide-react";

import { Section, SectionHeading } from "@/components/Section";
import { Card } from "@/components/ui/card";

type Feature = {
  icon: LucideIcon;
  title: string;
  blurb: string;
};

const features: Feature[] = [
  {
    icon: Headphones,
    title: "Listening",
    blurb:
      "Follow meetings, calls and voicemails — and catch the action items that actually matter.",
  },
  {
    icon: BookOpen,
    title: "Reading",
    blurb:
      "Scan emails, reports and contracts for the detail that changes the decision.",
  },
  {
    icon: SpellCheck,
    title: "Grammar & Vocabulary",
    blurb:
      "Use precise, professional language — the difference between “fine” and “polished”.",
  },
  {
    icon: PenLine,
    title: "Writing",
    blurb:
      "Draft clear replies, summaries and proposals that get read and get results.",
  },
  {
    icon: Mic,
    title: "Speaking",
    blurb:
      "Present, negotiate and answer on the spot with confidence and clarity.",
  },
];

export function Features() {
  return (
    <Section id="levels">
      <SectionHeading
        eyebrow="What LBET measures"
        title="Five workplace skills, one clear score"
        description="Every section mirrors a real business situation — so your result reflects how you perform on the job, not in a classroom."
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, blurb }) => (
          <Card
            key={title}
            className="group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/8 text-primary-mid transition-colors group-hover:bg-teal/12 group-hover:text-teal">
              <Icon className="size-6" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-foreground">
              {title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {blurb}
            </p>
          </Card>
        ))}

        {/* CEFR / scoring summary card */}
        <Card className="flex flex-col justify-between overflow-hidden bg-primary p-6 text-primary-foreground">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal">
              Scored on the CEFR
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-white/80">
              Results map to the international A1–C2 scale, plus a 0–200 point
              score for fine-grained comparison.
            </p>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="CEFR levels">
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => (
              <li
                key={lvl}
                className="rounded-lg bg-white/10 px-2.5 py-1 text-sm font-bold tabular-nums text-white ring-1 ring-inset ring-white/15"
              >
                {lvl}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Section>
  );
}
