"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Lang = "en" | "ar";

/** One LBE level, bilingual, for Q20's structured answer. */
type LbeLevelDef = {
  level: string;
  nameEn: string;
  nameAr: string;
  canEn: string;
  canAr: string;
};

const LBE_LEVELS: LbeLevelDef[] = [
  {
    level: "LBE 1",
    nameEn: "Foundation",
    nameAr: "Foundation (الأساسي)",
    canEn: "Can understand and use basic Business English in simple workplace situations.",
    canAr: "يمكنه فهم واستخدام اللغة الإنجليزية للأعمال في مواقف العمل البسيطة.",
  },
  {
    level: "LBE 2",
    nameEn: "Operational",
    nameAr: "Operational (التشغيلي)",
    canEn: "Can communicate confidently in routine workplace tasks and everyday business conversations.",
    canAr: "يمكنه التواصل بثقة في المهام اليومية والمحادثات الروتينية في بيئة العمل.",
  },
  {
    level: "LBE 3",
    nameEn: "Professional",
    nameAr: "Professional (المهني)",
    canEn: "Can participate effectively in meetings, emails, and professional discussions.",
    canAr: "يمكنه المشاركة بفاعلية في الاجتماعات، ورسائل البريد الإلكتروني، والمناقشات المهنية.",
  },
  {
    level: "LBE 4",
    nameEn: "Advanced Professional",
    nameAr: "Advanced Professional (المهني المتقدم)",
    canEn: "Can communicate fluently and confidently in complex business situations.",
    canAr: "يمكنه التواصل بطلاقة وثقة في مواقف العمل المعقدة.",
  },
  {
    level: "LBE 5",
    nameEn: "Executive",
    nameAr: "Executive (التنفيذي)",
    canEn: "Can lead, negotiate, present, and communicate strategically in an international workplace.",
    canAr: "يمكنه القيادة، والتفاوض، وتقديم العروض، والتواصل الاستراتيجي في بيئة العمل الدولية.",
  },
];

type FaqItem = {
  qEn: string;
  qAr: string;
  aEn?: string;
  aAr?: string;
  levels?: LbeLevelDef[];
};
type FaqCategory = {
  id: string;
  titleEn: string;
  titleAr: string;
  items: FaqItem[];
};

const categories: FaqCategory[] = [
  {
    id: "about-lbe",
    titleEn: "About LBE",
    titleAr: "حول اختبار LBE",
    items: [
      { qEn: "What is the LBE Exam?", qAr: "ما هو اختبار LBE؟", aEn: "It is the world's first standardized Business English proficiency test.", aAr: "هو أول اختبار عالمي موحد لقياس الكفاءة في اللغة الإنجليزية للأعمال." },
      { qEn: "What does LBE stand for?", qAr: "ماذا تعني LBE؟", aEn: "Locrativ Business English.", aAr: "Locrativ Business English." },
      { qEn: "Why was LBE created?", qAr: "لماذا تم إنشاء اختبار LBE؟", aEn: "To assess Business English proficiency and workplace communication skills for professionals who want to get a job, earn a promotion, or demonstrate their Business English proficiency.", aAr: "لقياس الكفاءة في اللغة الإنجليزية للأعمال ومهارات التواصل في بيئة العمل، للأشخاص الذين يسعون للحصول على وظيفة، أو ترقية، أو إثبات كفاءتهم في اللغة الإنجليزية للأعمال." },
      { qEn: "What makes LBE different from IELTS or TOEFL?", qAr: "ما الذي يميز LBE عن IELTS أو TOEFL؟", aEn: "LBE measures the understanding and expression competencies required for workplace communication.", aAr: "يقيس LBE مهارات الفهم والتعبير المطلوبة للتواصل الفعال في بيئة العمل." },
      { qEn: "Who should take the LBE Exam?", qAr: "من الذي ينبغي له التقدم لاختبار LBE؟", aEn: "Job seekers, employees seeking career advancement, and business owners who want to assess their Business English proficiency and workplace communication skills.", aAr: "الباحثون عن عمل، والموظفون الساعون للتطور الوظيفي، وأصحاب الأعمال الذين يرغبون في تقييم كفاءتهم في اللغة الإنجليزية للأعمال ومهارات التواصل المهني." },
      { qEn: "Who is the exam NOT suitable for?", qAr: "لمن لا يُناسب اختبار LBE؟", aEn: "School students.", aAr: "طلاب المدارس." },
      { qEn: "Is LBE internationally recognized?", qAr: "هل اختبار LBE معترف به دوليًا؟", aEn: "Yes. LBE is the world's first standardized Business English proficiency test designed for individuals and organizations.", aAr: "نعم. يُعد LBE أول اختبار عالمي موحد لقياس الكفاءة في اللغة الإنجليزية للأعمال، ومصمم للأفراد والمؤسسات." },
      { qEn: "Is LBE accepted by companies?", qAr: "هل تقبل الشركات شهادة LBE؟", aEn: "Yes. Most companies across the MENA region and the Arab world recognize and accept LBE, and consider LBE 3 as “Qualified.”", aAr: "نعم. تعتمد معظم الشركات في منطقة الشرق الأوسط وشمال أفريقيا والعالم العربي شهادة LBE، وتعتبر مستوى LBE 3 دليلاً على أن المتقدم «مؤهل»." },
      { qEn: "What does the certificate prove?", qAr: "ماذا تثبت شهادة LBE؟", aEn: "It proves that you have the Business English proficiency required to understand and express yourself effectively in professional workplace situations.", aAr: "تثبت أنك تمتلك الكفاءة في اللغة الإنجليزية للأعمال اللازمة لفهم المواقف المهنية والتعبير عن نفسك بفعالية في بيئة العمل." },
    ],
  },
  {
    id: "exam-structure",
    titleEn: "Exam Structure",
    titleAr: "هيكل الاختبار",
    items: [
      { qEn: "What skills does the exam measure?", qAr: "ما المهارات التي يقيسها الاختبار؟", aEn: "Business English proficiency, speaking, listening, reading, writing, and workplace communication skills.", aAr: "الكفاءة في اللغة الإنجليزية للأعمال، ومهارات التحدث، والاستماع، والقراءة، والكتابة، والتواصل في بيئة العمل." },
      { qEn: "What topics are covered?", qAr: "ما الموضوعات التي يغطيها الاختبار؟", aEn: "General Business English topics, including Sales, Marketing, HR, Management, Meetings, Presentations, Emails, Customer Service, and Finance.", aAr: "يغطي موضوعات اللغة الإنجليزية للأعمال، مثل: المبيعات، التسويق، الموارد البشرية، الإدارة، الاجتماعات، العروض التقديمية، البريد الإلكتروني، خدمة العملاء، والمالية." },
      { qEn: "How many questions are there?", qAr: "كم عدد أسئلة الاختبار؟", aEn: "The exam consists of five sections with ten questions in each section.", aAr: "يتكون الاختبار من 5 أقسام، ويحتوي كل قسم على 10 أسئلة." },
      { qEn: "How long does the exam take?", qAr: "كم يستغرق الاختبار؟", aEn: "60 minutes.", aAr: "60 دقيقة." },
      { qEn: "Is there a speaking section?", qAr: "هل يوجد قسم للتحدث؟", aEn: "Yes. Speaking responses are evaluated using AI grading with human review.", aAr: "نعم. يتم تقييم الإجابات باستخدام الذكاء الاصطناعي مع مراجعة بشرية." },
      { qEn: "Is there a writing section?", qAr: "هل يوجد قسم للكتابة؟", aEn: "Yes. Writing responses are evaluated using AI grading with human review.", aAr: "نعم. يتم تقييم الإجابات باستخدام الذكاء الاصطناعي مع مراجعة بشرية." },
      { qEn: "Is there a listening section?", qAr: "هل يوجد قسم للاستماع؟", aEn: "Yes. One or two sections include Business English listening audio.", aAr: "نعم. يتضمن قسم أو قسمان مقاطع صوتية باللغة الإنجليزية للأعمال." },
      { qEn: "Is there a reading section?", qAr: "هل يوجد قسم للقراءة؟", aEn: "Yes.", aAr: "نعم." },
    ],
  },
  {
    id: "scoring",
    titleEn: "Scoring",
    titleAr: "الدرجات",
    items: [
      { qEn: "How is the exam scored?", qAr: "كيف يتم احتساب النتيجة؟", aEn: "The exam consists of five sections (LBE 1 to LBE 5). Each section contains ten questions. Answering at least six questions correctly means you have passed that section. Your final LBE level depends on how many sections you successfully pass.", aAr: "يتكون الاختبار من خمسة مستويات (LBE 1 إلى LBE 5). يحتوي كل مستوى على عشرة أسئلة. إذا أجبت على ستة أسئلة أو أكثر بشكل صحيح، فإنك تجتاز ذلك المستوى. ويعتمد مستواك النهائي على عدد المستويات التي اجتزتها." },
      { qEn: "What is the highest score?", qAr: "ما أعلى مستوى يمكن الحصول عليه؟", aEn: "The highest score is LBE 5. However, LBE 3 is considered “Qualified.”", aAr: "أعلى مستوى هو LBE 5، بينما يُعتبر LBE 3 مستوى «مؤهل»." },
      { qEn: "What are LBE 1–LBE 5?", qAr: "ماذا تعني مستويات LBE؟", levels: LBE_LEVELS },
      { qEn: "What score do I need to pass?", qAr: "ما الدرجة المطلوبة لاجتياز الاختبار؟", aEn: "There is no pass or fail. Your result simply reflects your achieved LBE level, from LBE 1 to LBE 5.", aAr: "لا يوجد نجاح أو رسوب. تُظهر النتيجة فقط المستوى الذي حققته، من LBE 1 إلى LBE 5." },
      { qEn: "How long does it take to receive my results?", qAr: "متى أحصل على النتيجة؟", aEn: "Within 48 hours.", aAr: "خلال 48 ساعة." },
      { qEn: "Will I receive detailed feedback?", qAr: "هل سأحصل على تقرير تفصيلي؟", aEn: "Yes. However, the actual exam questions are not provided.", aAr: "نعم، ولكن لا يتم عرض أسئلة الاختبار الفعلية." },
    ],
  },
  {
    id: "certificate",
    titleEn: "Certificate",
    titleAr: "الشهادة",
    items: [
      { qEn: "How do I receive my certificate?", qAr: "كيف أحصل على الشهادة؟", aEn: "Your certificate will be available in your LBETest.com account within 48 hours after completing the exam.", aAr: "ستكون الشهادة متاحة في حسابك على LBETest.com خلال 48 ساعة من إكمال الاختبار." },
      { qEn: "Is the certificate digital?", qAr: "هل الشهادة رقمية؟", aEn: "Yes. It is provided as a downloadable PDF and can be verified on LBETest.com.", aAr: "نعم. يتم إصدارها بصيغة PDF ويمكن تنزيلها والتحقق منها عبر LBETest.com." },
      { qEn: "Does the certificate expire?", qAr: "هل تنتهي صلاحية الشهادة؟", aEn: "Yes. The certificate is valid for 12 months.", aAr: "نعم. مدة صلاحيتها 12 شهرًا." },
      { qEn: "How can employers verify my certificate?", qAr: "كيف يمكن لصاحب العمل التحقق من الشهادة؟", aEn: "Employers can verify your certificate on LBETest.com using your unique verification code.", aAr: "من خلال LBETest.com باستخدام رمز التحقق الفريد الخاص بالشهادة." },
      { qEn: "Does every certificate have a unique verification code?", qAr: "هل تحتوي كل شهادة على رمز تحقق فريد؟", aEn: "Yes.", aAr: "نعم." },
      { qEn: "Can I add it to my CV?", qAr: "هل يمكنني إضافتها إلى سيرتي الذاتية؟", aEn: "Yes.", aAr: "نعم." },
      { qEn: "Can I add it to LinkedIn?", qAr: "هل يمكنني إضافتها إلى LinkedIn؟", aEn: "Yes.", aAr: "نعم." },
    ],
  },
  {
    id: "registration",
    titleEn: "Registration",
    titleAr: "التسجيل",
    items: [
      { qEn: "How do I register?", qAr: "كيف يمكنني التسجيل؟", aEn: "Sign in with your Google account, go to the Purchase page, choose your package, and complete your payment.", aAr: "سجل الدخول باستخدام حساب Google، ثم انتقل إلى صفحة الشراء، واختر الباقة المناسبة، وأكمل عملية الدفع." },
      { qEn: "How much does the exam cost?", qAr: "كم تبلغ رسوم الاختبار؟", aEn: "Test Only is $86 (4,400 EGP). Test + Training is $194 (10,000 EGP).", aAr: "باقة Test Only بسعر 86 دولارًا (4,400 جنيهًا)، وباقة Test + Training بسعر 194 دولارًا (10,000 جنيهًا)." },
      { qEn: "What payment methods are accepted?", qAr: "ما وسائل الدفع المتاحة؟", aEn: "Paymob or manual payment via WhatsApp (+20 109 796 5058).", aAr: "يمكن الدفع عبر Paymob أو الدفع اليدوي من خلال واتساب (‎+20 109 796 5058‎)." },
      { qEn: "Can I cancel my booking?", qAr: "هل يمكنني إلغاء الحجز؟", aEn: "No. All bookings are non-refundable.", aAr: "لا. جميع الحجوزات غير قابلة للاسترداد." },
      { qEn: "Can I reschedule my exam?", qAr: "هل يمكنني تغيير موعد الاختبار؟", aEn: "No. Once your exam has been booked, it cannot be rescheduled.", aAr: "لا. بعد تأكيد الحجز لا يمكن إعادة جدولة الاختبار." },
      { qEn: "Can I get a refund?", qAr: "هل يمكنني استرداد الرسوم؟", aEn: "No. All bookings are non-refundable.", aAr: "لا. جميع الحجوزات غير قابلة للاسترداد." },
    ],
  },
  {
    id: "exam-day",
    titleEn: "Exam Day",
    titleAr: "يوم الاختبار",
    items: [
      { qEn: "Can I take the exam from home?", qAr: "هل يمكنني أداء الاختبار من المنزل؟", aEn: "Yes. The exam is completely online.", aAr: "نعم. الاختبار يتم بالكامل عبر الإنترنت." },
      { qEn: "What equipment do I need?", qAr: "ما الأجهزة التي يمكنني استخدامها؟", aEn: "You can take the exam using a laptop, desktop computer, tablet, iPad, or mobile phone with a working front camera.", aAr: "يمكنك أداء الاختبار باستخدام جهاز كمبيوتر، أو لابتوب، أو جهاز لوحي، أو iPad، أو هاتف ذكي مزود بكاميرا أمامية تعمل." },
      { qEn: "Do I need a webcam?", qAr: "هل أحتاج إلى كاميرا؟", aEn: "Yes.", aAr: "نعم." },
      { qEn: "Do I need a microphone?", qAr: "هل أحتاج إلى ميكروفون؟", aEn: "Yes.", aAr: "نعم." },
    ],
  },
  {
    id: "security",
    titleEn: "Security",
    titleAr: "الأمان",
    items: [
      { qEn: "How do you prevent cheating?", qAr: "كيف تمنعون الغش؟", aEn: "LBE uses multiple layers of security, including identity verification, AI-assisted monitoring, secure exam technology, randomized questions, browser restrictions, and post-exam review. Any suspicious activity may result in score cancellation or certificate revocation.", aAr: "يستخدم LBE عدة طبقات من الحماية، تشمل التحقق من الهوية، والمراقبة المدعومة بالذكاء الاصطناعي، وتقنيات الاختبار الآمنة، والأسئلة العشوائية، وقيود المتصفح، والمراجعة بعد الاختبار. وقد يؤدي أي نشاط مشبوه إلى إلغاء النتيجة أو سحب الشهادة." },
      { qEn: "Is the exam monitored?", qAr: "هل يتم مراقبة الاختبار؟", aEn: "Yes.", aAr: "نعم." },
      { qEn: "Can I use AI during the exam?", qAr: "هل يمكنني استخدام الذكاء الاصطناعي أثناء الاختبار؟", aEn: "No.", aAr: "لا." },
      { qEn: "Can I use Google during the exam?", qAr: "هل يمكنني استخدام Google أثناء الاختبار؟", aEn: "No.", aAr: "لا." },
      { qEn: "Can I use a dictionary during the exam?", qAr: "هل يمكنني استخدام القاموس أثناء الاختبار؟", aEn: "No.", aAr: "لا." },
      { qEn: "What happens if cheating is detected?", qAr: "ماذا يحدث إذا تم اكتشاف الغش؟", aEn: "Your score may be canceled, and your certificate may be revoked.", aAr: "قد يتم إلغاء نتيجتك وسحب شهادتك." },
    ],
  },
  {
    id: "preparation",
    titleEn: "Preparation",
    titleAr: "التحضير",
    items: [
      { qEn: "How should I prepare?", qAr: "كيف يمكنني الاستعداد للاختبار؟", aEn: "You can prepare by using the Locrativ Business English app, joining the LBE Training (recorded Business English sessions), and following the Locrativ Business English YouTube channel.", aAr: "يمكنك الاستعداد باستخدام تطبيق Locrativ Business English، أو الالتحاق بدورة LBE Training المسجلة، أو متابعة قناة Locrativ Business English على YouTube." },
      { qEn: "Is there an official preparation course?", qAr: "هل توجد دورة تحضيرية رسمية؟", aEn: "Yes.", aAr: "نعم." },
      { qEn: "Is there an official preparation app?", qAr: "هل يوجد تطبيق رسمي للتحضير؟", aEn: "Yes.", aAr: "نعم." },
      { qEn: "Are there practice tests?", qAr: "هل توجد اختبارات تدريبية؟", aEn: "Yes.", aAr: "نعم." },
      { qEn: "Are there mock exams?", qAr: "هل توجد اختبارات محاكاة؟", aEn: "Yes.", aAr: "نعم." },
      { qEn: "How long should I prepare?", qAr: "كم أحتاج من الوقت للاستعداد؟", aEn: "Preparation time depends on your current level of Business English proficiency.", aAr: "يعتمد ذلك على مستواك الحالي في اللغة الإنجليزية للأعمال." },
    ],
  },
  {
    id: "companies",
    titleEn: "Companies",
    titleAr: "الشركات",
    items: [
      { qEn: "Can companies use LBE for hiring?", qAr: "هل يمكن للشركات استخدام LBE في التوظيف؟", aEn: "Yes. LBE offers customized Business English assessment and training solutions for companies and organizations.", aAr: "نعم. يوفر LBE حلولًا مخصصة لتقييم وتدريب اللغة الإنجليزية للأعمال للشركات والمؤسسات." },
      { qEn: "Can companies verify certificates?", qAr: "هل يمكن للشركات التحقق من الشهادات؟", aEn: "Yes. Companies have access to a dedicated admin dashboard where they can verify certificates and monitor employees' training progress and assessment results.", aAr: "نعم. تحصل الشركات على لوحة تحكم خاصة تُمكّنها من التحقق من الشهادات ومتابعة تقدم الموظفين في التدريب ونتائج التقييم." },
      { qEn: "Do companies receive reports?", qAr: "هل تحصل الشركات على تقارير؟", aEn: "Yes. Companies receive detailed reports through a dedicated admin dashboard, allowing them to monitor employees' training progress and assessment results.", aAr: "نعم. تحصل الشركات على تقارير تفصيلية من خلال لوحة تحكم مخصصة لمتابعة تقدم الموظفين ونتائجهم." },
    ],
  },
  {
    id: "technical",
    titleEn: "Technical",
    titleAr: "المتطلبات التقنية",
    items: [
      { qEn: "Which browsers are supported?", qAr: "ما المتصفح الموصى به؟", aEn: "Google Chrome is recommended.", aAr: "يوصى باستخدام Google Chrome." },
      { qEn: "Can I use a mobile phone?", qAr: "هل يمكنني استخدام الهاتف المحمول؟", aEn: "Yes, provided it has a working camera and microphone.", aAr: "نعم، بشرط أن يكون مزودًا بكاميرا وميكروفون يعملان." },
      { qEn: "Can I use a tablet or iPad?", qAr: "هل يمكنني استخدام جهاز لوحي أو iPad؟", aEn: "Yes, provided it has a working camera and microphone.", aAr: "نعم، بشرط أن يكون مزودًا بكاميرا وميكروفون يعملان." },
    ],
  },
];

const COPY: Record<Lang, { eyebrow: string; title: string; definition: string }> = {
  en: {
    eyebrow: "FAQ",
    title: "Questions, answered.",
    definition:
      "LBE (Locrativ Business English) is the world's first standardized Business English proficiency test, designed to measure the understanding and expression competencies required for today's workplace.",
  },
  ar: {
    eyebrow: "الأسئلة الشائعة",
    title: "إجابات على أسئلتك",
    definition:
      "LBE (Locrativ Business English) هو أول اختبار عالمي موحد لقياس الكفاءة في اللغة الإنجليزية للأعمال، وقد صُمم لقياس مهارات الفهم والتعبير المطلوبة للنجاح في بيئة العمل الحديثة.",
  },
};

export function Faq() {
  const [lang, setLang] = React.useState<Lang>("en");
  const isAr = lang === "ar";
  const copy = COPY[lang];

  return (
    <Section id="faq">
      {/* Language toggle */}
      <div className="mb-8 flex justify-center" dir="ltr">
        <div
          role="group"
          aria-label="FAQ language"
          className="inline-flex gap-1 rounded-full border border-gold/25 bg-gold/5 p-1"
        >
          {(["en", "ar"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => setLang(l)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                lang === l
                  ? "gold-foil text-white shadow-gold"
                  : "text-charcoal/70 hover:text-gold",
              )}
            >
              {l === "en" ? "English" : "العربية"}
            </button>
          ))}
        </div>
      </div>

      <div dir={isAr ? "rtl" : "ltr"}>
        {/* Heading (mirrors SectionHeading, but language-aware) */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="mx-auto max-w-xs ornament-rule">
            <p className="eyebrow shrink-0">{copy.eyebrow}</p>
          </div>
          <h2 className="font-serif-display mt-5 text-4xl leading-[1.02] text-charcoal sm:text-5xl">
            {copy.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            {copy.definition}
          </p>
        </Reveal>

        {/* Category jump links */}
        <Reveal className="mx-auto mt-10 max-w-3xl">
          <nav
            aria-label={isAr ? "أقسام الأسئلة" : "FAQ categories"}
            className="flex flex-wrap justify-center gap-2"
          >
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`#faq-${cat.id}`}
                className="rounded-full border border-gold/35 bg-gold/5 px-3.5 py-1.5 text-xs font-semibold text-charcoal transition-colors hover:bg-gold/12 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {isAr ? cat.titleAr : cat.titleEn}
              </a>
            ))}
          </nav>
        </Reveal>

        <div className="mx-auto mt-12 max-w-3xl space-y-14">
          {categories.map((cat) => (
            <div key={cat.id} id={`faq-${cat.id}`} className="scroll-mt-28">
              <Reveal>
                <div className="mx-auto mb-6 max-w-xs ornament-rule">
                  <h3 className="eyebrow shrink-0">
                    {isAr ? cat.titleAr : cat.titleEn}
                  </h3>
                </div>
              </Reveal>
              <Accordion type="single" collapsible className="space-y-3">
                {cat.items.map((item, i) => (
                  <Reveal key={item.qEn} delay={i * 40}>
                    <AccordionItem value={`${cat.id}-${i}`}>
                      <AccordionTrigger>
                        {isAr ? item.qAr : item.qEn}
                      </AccordionTrigger>
                      <AccordionContent>
                        {item.levels ? (
                          <dl className="space-y-3">
                            {item.levels.map((lvl) => (
                              <div key={lvl.level}>
                                <dt className="font-semibold text-charcoal">
                                  {lvl.level}{" "}
                                  <span className="text-gold">
                                    &mdash; {isAr ? lvl.nameAr : lvl.nameEn}
                                  </span>
                                </dt>
                                <dd className="text-muted-foreground">
                                  {isAr ? lvl.canAr : lvl.canEn}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        ) : isAr ? (
                          item.aAr
                        ) : (
                          item.aEn
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Reveal>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
