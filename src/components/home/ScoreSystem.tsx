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

      <ol className="relative mx-auto mt-14 max-w-4xl space-y-3 before:absolute before:bottom-8 before:left-[2.05rem] before:top-8 before:w-px before:bg-gold/25 sm:before:left-[5.5rem]">
        {levels.map((level, index) => (
          <li
            key={level.code}
            className={cn(
              "paper-panel group relative flex flex-col gap-3 border bg-card/95 p-6 pl-20 transition-all duration-300 hover:translate-x-1 hover:border-gold/40 sm:flex-row sm:items-center sm:gap-8 sm:pl-6",
              level.qualified ? "border-gold/60 ring-1 ring-gold/25" : "border-gold/20",
            )}
          >
            <span className={cn("absolute left-5 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border bg-card text-xs font-semibold tabular-nums sm:left-[4.7rem]", level.qualified ? "gold-foil border-gold text-white shadow-gold" : "border-gold/40 text-gold")}>{index + 1}</span>
            <div className="flex shrink-0 items-center gap-3 sm:w-48 sm:flex-col sm:items-start sm:gap-1 sm:pl-24">
              <span className="font-serif-display text-2xl text-gold">
                {level.code}
              </span>
              <span className="text-sm font-semibold text-charcoal">
                {level.name}
              </span>
              {level.qualified && (
                <span className="gold-foil inline-flex items-center rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white shadow-gold">
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
