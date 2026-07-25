import { Section, SectionHeading } from "@/components/Section";
import { cn } from "@/lib/utils";

type Level = {
  code: string;
  name: string;
  blurb: string;
  qualified?: boolean;
};

const levels: Level[] = [
  {
    code: "LBE1",
    name: "Foundation",
    blurb:
      "Can understand and use basic Business English in simple workplace situations.",
  },
  {
    code: "LBE2",
    name: "Operational",
    blurb:
      "Can communicate confidently during routine workplace tasks and everyday business conversations.",
  },
  {
    code: "LBE3",
    name: "Professional",
    blurb:
      "Can participate effectively in meetings, write professional emails and contribute confidently to workplace discussions.",
    qualified: true,
  },
  {
    code: "LBE4",
    name: "Advanced Professional",
    blurb:
      "Can communicate fluently and confidently in complex business situations that require precision, adaptability and professional judgment.",
  },
  {
    code: "LBE5",
    name: "Executive",
    blurb:
      "Can lead, negotiate, present and communicate strategically in an international workplace.",
  },
];

export function ScoreSystem() {
  return (
    <Section id="score-system" surface="white">
      <SectionHeading
        eyebrow="LBE Score System"
        title="Five levels of workplace English."
        description="The Locrativ Business English Exam evaluates two core competencies: understanding workplace English and expressing yourself effectively in professional situations."
      />

      <ol className="mx-auto mt-14 max-w-3xl space-y-4">
        {levels.map((level) => (
          <li
            key={level.code}
            className={cn(
              "flex flex-col gap-3 rounded-2xl border bg-card p-6 shadow-card sm:flex-row sm:items-center sm:gap-6",
              level.qualified ? "border-gold/50 ring-1 ring-gold/25" : "border-gold/20",
            )}
          >
            <div className="flex shrink-0 items-center gap-3 sm:w-44 sm:flex-col sm:items-start sm:gap-1">
              <span className="font-serif-display text-2xl text-gold">
                {level.code}
              </span>
              <span className="text-sm font-semibold text-charcoal">
                {level.name}
              </span>
              {level.qualified && (
                <span className="inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-gold">
                  Qualified
                </span>
              )}
            </div>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              {level.blurb}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
