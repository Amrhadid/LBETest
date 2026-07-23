import { Section, SectionHeading } from "@/components/Section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How long is the test and what does it cover?",
    a: "LBET takes about 60 minutes and covers five workplace skills — Listening, Reading, Grammar & Vocabulary, Writing and Speaking. It’s adaptive, so questions adjust to your level as you go.",
  },
  {
    q: "How is it scored?",
    a: "You receive an overall score from 0–200 and a CEFR level from A1 to C2, plus a breakdown for each skill. Auto-scored sections are returned instantly; where human review applies, results are confirmed within 48 hours.",
  },
  {
    q: "Is the certificate recognized by employers?",
    a: "LBET is aligned to the CEFR, the international standard employers and institutions already use. Every certificate has a unique ID that anyone can validate at lbetest.com/verify.",
  },
  {
    q: "Do I need a test center or a proctor?",
    a: "No. You can take LBET from any modern browser at home or at work. For high-stakes use, organizations can enable optional online proctoring.",
  },
  {
    q: "What do I need to take the test?",
    a: "A quiet space, a stable internet connection, a microphone for the Speaking section, and around an hour of uninterrupted time. That’s it.",
  },
  {
    q: "Can I retake the test?",
    a: "Yes. You can retake LBET to improve your score — the Retake bundle includes a second attempt within 90 days, and your certificate always reflects your best result.",
  },
];

export function Faq() {
  return (
    <Section id="faq" muted>
      <SectionHeading eyebrow="FAQ" title="Questions, answered" />

      <div className="mx-auto mt-12 max-w-3xl">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
