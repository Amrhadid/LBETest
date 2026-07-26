import { Section, SectionHeading } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/** One LBE level, used to render Q20's structured answer. */
type LbeLevelDef = { level: string; name: string; can: string };

const LBE_LEVELS: LbeLevelDef[] = [
  { level: "LBE 1", name: "Foundation", can: "Can understand and use basic Business English in simple workplace situations." },
  { level: "LBE 2", name: "Operational", can: "Can communicate confidently in routine workplace tasks and everyday business conversations." },
  { level: "LBE 3", name: "Professional", can: "Can participate effectively in meetings, emails, and professional discussions." },
  { level: "LBE 4", name: "Advanced Professional", can: "Can communicate fluently and confidently in complex business situations." },
  { level: "LBE 5", name: "Executive", can: "Can lead, negotiate, present, and communicate strategically in an international workplace." },
];

type FaqItem = { q: string; a?: string; levels?: LbeLevelDef[] };
type FaqCategory = { id: string; title: string; items: FaqItem[] };

const categories: FaqCategory[] = [
  {
    id: "about-lbe",
    title: "About LBE",
    items: [
      { q: "What is the LBE Exam?", a: "It is the world's first standardized Business English proficiency test." },
      { q: "What does LBE stand for?", a: "Locrativ Business English." },
      { q: "Why was LBE created?", a: "To assess Business English proficiency and workplace communication skills for professionals who want to get a job, earn a promotion, or demonstrate their Business English proficiency." },
      { q: "What makes LBE different from IELTS or TOEFL?", a: "LBE measures the understanding and expression competencies required for workplace communication." },
      { q: "Who should take the LBE Exam?", a: "Job seekers, employees seeking career advancement, and business owners who want to assess their Business English proficiency and workplace communication skills." },
      { q: "Who is the exam NOT suitable for?", a: "School students." },
      { q: "Is LBE internationally recognized?", a: "Yes. LBE is the world's first standardized Business English proficiency test designed for individuals and organizations." },
      { q: "Is LBE accepted by companies?", a: "Yes. Most companies across the MENA region and the Arab world recognize and accept LBE, and consider LBE 3 as “Qualified.”" },
      { q: "What does the certificate prove?", a: "It proves that you have the Business English proficiency required to understand and express yourself effectively in professional workplace situations." },
    ],
  },
  {
    id: "exam-structure",
    title: "Exam Structure",
    items: [
      { q: "What skills does the exam measure?", a: "Business English proficiency, speaking, listening, reading, writing, and workplace communication skills." },
      { q: "What topics are covered?", a: "General Business English topics, including Sales, Marketing, HR, Management, Meetings, Presentations, Emails, Customer Service, and Finance." },
      { q: "How many questions are there?", a: "The exam consists of five sections with ten questions in each section." },
      { q: "How long does the exam take?", a: "60 minutes." },
      { q: "Is there a speaking section?", a: "Yes. Speaking responses are evaluated using AI grading with human review." },
      { q: "Is there a writing section?", a: "Yes. Writing responses are evaluated using AI grading with human review." },
      { q: "Is there a listening section?", a: "Yes. One or two sections include Business English listening audio." },
      { q: "Is there a reading section?", a: "Yes." },
    ],
  },
  {
    id: "scoring",
    title: "Scoring",
    items: [
      { q: "How is the exam scored?", a: "The exam consists of five sections (LBE 1 to LBE 5). Each section contains ten questions. Answering at least six questions correctly means you have passed that section. Your final LBE level depends on how many sections you successfully pass." },
      { q: "What is the highest score?", a: "The highest score is LBE 5. However, LBE 3 is considered “Qualified.”" },
      { q: "What are LBE 1–LBE 5?", levels: LBE_LEVELS },
      { q: "What score do I need to pass?", a: "There is no pass or fail. Your result simply reflects your achieved LBE level, from LBE 1 to LBE 5." },
      { q: "How long does it take to receive my results?", a: "Within 48 hours." },
      { q: "Will I receive detailed feedback?", a: "Yes. However, the actual exam questions are not provided." },
    ],
  },
  {
    id: "certificate",
    title: "Certificate",
    items: [
      { q: "How do I receive my certificate?", a: "Your certificate will be available in your LBETest.com account within 48 hours after completing the exam." },
      { q: "Is the certificate digital?", a: "Yes. It is provided as a downloadable PDF and can be verified on LBETest.com." },
      { q: "Does the certificate expire?", a: "Yes. The certificate is valid for 12 months." },
      { q: "How can employers verify my certificate?", a: "Employers can verify your certificate on LBETest.com using your unique verification code." },
      { q: "Does every certificate have a unique verification code?", a: "Yes." },
      { q: "Can I add it to my CV?", a: "Yes." },
      { q: "Can I add it to LinkedIn?", a: "Yes." },
    ],
  },
  {
    id: "registration",
    title: "Registration",
    items: [
      { q: "How do I register?", a: "Sign in with your Google account, go to the Purchase page, choose your package, and complete your payment." },
      { q: "How much does the exam cost?", a: "The exam costs $89 worldwide." },
      { q: "What payment methods are accepted?", a: "Paymob or manual payment via WhatsApp (+20 109 796 5058)." },
      { q: "Can I cancel my booking?", a: "No. All bookings are non-refundable." },
      { q: "Can I reschedule my exam?", a: "No. Once your exam has been booked, it cannot be rescheduled." },
      { q: "Can I get a refund?", a: "No. All bookings are non-refundable." },
    ],
  },
  {
    id: "exam-day",
    title: "Exam Day",
    items: [
      { q: "Can I take the exam from home?", a: "Yes. The exam is completely online." },
      { q: "What equipment do I need?", a: "You can take the exam using a laptop, desktop computer, tablet, iPad, or mobile phone with a working front camera." },
      { q: "Do I need a webcam?", a: "Yes." },
      { q: "Do I need a microphone?", a: "Yes." },
    ],
  },
  {
    id: "security",
    title: "Security",
    items: [
      { q: "How do you prevent cheating?", a: "LBE uses multiple layers of security, including identity verification, AI-assisted monitoring, secure exam technology, randomized questions, browser restrictions, and post-exam review. Any suspicious activity may result in score cancellation or certificate revocation." },
      { q: "Is the exam monitored?", a: "Yes." },
      { q: "Can I use AI during the exam?", a: "No." },
      { q: "Can I use Google during the exam?", a: "No." },
      { q: "Can I use a dictionary during the exam?", a: "No." },
      { q: "What happens if cheating is detected?", a: "Your score may be canceled, and your certificate may be revoked." },
    ],
  },
  {
    id: "preparation",
    title: "Preparation",
    items: [
      { q: "How should I prepare?", a: "You can prepare by using the Locrativ Business English app, joining the LBE Training (recorded Business English sessions), and following the Locrativ Business English YouTube channel." },
      { q: "Is there an official preparation course?", a: "Yes." },
      { q: "Is there an official preparation app?", a: "Yes." },
      { q: "Are there practice tests?", a: "Yes." },
      { q: "Are there mock exams?", a: "Yes." },
      { q: "How long should I prepare?", a: "Preparation time depends on your current level of Business English proficiency." },
    ],
  },
  {
    id: "companies",
    title: "Companies",
    items: [
      { q: "Can companies use LBE for hiring?", a: "Yes. LBE offers customized Business English assessment and training solutions for companies and organizations." },
      { q: "Can companies verify certificates?", a: "Yes. Companies have access to a dedicated admin dashboard where they can verify certificates and monitor employees' training progress and assessment results." },
      { q: "Do companies receive reports?", a: "Yes. Companies receive detailed reports through a dedicated admin dashboard, allowing them to monitor employees' training progress and assessment results." },
    ],
  },
  {
    id: "technical",
    title: "Technical",
    items: [
      { q: "Which browsers are supported?", a: "Google Chrome is recommended." },
      { q: "Can I use a mobile phone?", a: "Yes, provided it has a working camera and microphone." },
      { q: "Can I use a tablet or iPad?", a: "Yes, provided it has a working camera and microphone." },
    ],
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <SectionHeading
        eyebrow="FAQ"
        title="Questions, answered."
        description="LBE (Locrativ Business English) is the world's first standardized Business English proficiency test, designed to measure the understanding and expression competencies required for today's workplace."
      />

      {/* Category jump links */}
      <Reveal className="mx-auto mt-10 max-w-3xl">
        <nav
          aria-label="FAQ categories"
          className="flex flex-wrap justify-center gap-2"
        >
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`#faq-${cat.id}`}
              className="rounded-full border border-gold/35 bg-gold/5 px-3.5 py-1.5 text-xs font-semibold text-charcoal transition-colors hover:bg-gold/12 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {cat.title}
            </a>
          ))}
        </nav>
      </Reveal>

      <div className="mx-auto mt-12 max-w-3xl space-y-14">
        {categories.map((cat) => (
          <div key={cat.id} id={`faq-${cat.id}`} className="scroll-mt-28">
            <Reveal>
              <div className="mx-auto mb-6 max-w-xs ornament-rule">
                <h3 className="eyebrow shrink-0">{cat.title}</h3>
              </div>
            </Reveal>
            <Accordion type="single" collapsible className="space-y-3">
              {cat.items.map((item, i) => (
                <Reveal key={item.q} delay={i * 40}>
                  <AccordionItem value={`${cat.id}-${i}`}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent>
                      {item.levels ? (
                        <dl className="space-y-3">
                          {item.levels.map((lvl) => (
                            <div key={lvl.level}>
                              <dt className="font-semibold text-charcoal">
                                {lvl.level}{" "}
                                <span className="text-gold">
                                  &mdash; {lvl.name}
                                </span>
                              </dt>
                              <dd className="text-muted-foreground">{lvl.can}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        item.a
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Reveal>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </Section>
  );
}
