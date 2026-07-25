import { Section, SectionHeading } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/*
 * TODO(content): answers marked below are neutral placeholders that could not
 * be confirmed from existing code/content. Have them reviewed before launch.
 * None make unsupported recognition, security or scoring claims, and none
 * reference CEFR / A1–C2.
 */
const faqs = [
  {
    q: "How long does the LBE test take?",
    a: "The test is completed online in a single sitting and takes around an hour. You can take it from your own computer whenever suits you.", // TODO(content): confirm exact duration
  },
  {
    q: "What does the test assess?",
    a: "The LBE assesses the Business English you use at work across four skills, focused on real workplace situations such as meetings, emails and professional conversations.", // TODO(content): confirm the four assessed skills
  },
  {
    q: "What does LBE3 — Qualified mean?",
    a: "LBE3 (Professional) means you can participate effectively in meetings, write professional emails and contribute confidently to workplace discussions. It is the level at which a candidate is recognised as Qualified in Business English.",
  },
  {
    q: "When will I receive my results?",
    a: "Results are typically available within 48 hours of completing the test. You’ll receive your LBE level, workplace qualification and a skill breakdown.", // TODO(content): confirm results turnaround
  },
  {
    q: "How can employers verify my certificate?",
    a: "Every LBE certificate has a unique certificate ID. Anyone can confirm it by entering that ID in the certificate-verification section — no account is required.",
  },
  {
    q: "Can I retake the test?",
    a: "Yes. You can retake the LBE test to improve your result, and your certificate reflects your achieved level.", // TODO(content): confirm retake policy
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <SectionHeading eyebrow="FAQ" title="Questions, answered." />

      <div className="mx-auto mt-12 max-w-3xl">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((item, i) => (
            <Reveal key={item.q} delay={i * 60}>
              <AccordionItem value={`item-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            </Reveal>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
