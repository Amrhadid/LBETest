import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Award, BookOpen, BriefcaseBusiness,
  Building2, Check, Clock3, FileBadge2, Globe2, Headphones,
  Languages, LockKeyhole, MessageCircle, Mic2,
  PenLine, Play, ShieldCheck, Sparkles, Target, Users2,
} from "lucide-react";

import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Know the Test",
  description:
    "Everything you need to know about the Locrativ Business English (LBE) test — levels, skills, how it's graded, security, and certification.",
};

// Site palette (gold-and-ivory Locrativ identity).
const gold = "#C68A1E";
const goldSoft = "#E0B260";
const charcoal = "#1D1D1F";

const levels = [
  ["LBE 1", "Foundation"], ["LBE 2", "Operational"],
  ["LBE 3", "Professional"], ["LBE 4", "Advanced Professional"],
  ["LBE 5", "Executive"],
];
const topics = ["Sales", "Marketing", "HR", "Meetings", "Emails", "Customer Service", "Finance", "Management", "Presentations"];

function PillButton({ children, outline = false, href = "/start" }: { children: React.ReactNode; outline?: boolean; href?: string }) {
  return <Link href={href} className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition hover:-translate-y-0.5 ${outline ? "border border-gold/30 bg-card text-charcoal hover:border-gold" : "bg-gold text-white shadow-gold hover:brightness-95"}`}>{children}</Link>;
}

function SectionTitle({ eyebrow, children, light = false }: { eyebrow?: string; children: React.ReactNode; light?: boolean }) {
  return <div className="mx-auto mb-12 max-w-2xl text-center"><p className={`eyebrow mb-3 ${light ? "!text-gold-soft" : ""}`}>{eyebrow}</p><h2 className={`font-serif-display text-4xl sm:text-5xl ${light ? "text-white" : "text-charcoal"}`}>{children}</h2></div>;
}

export default function KnowTheTestPage() {
  return <PageShell><div className="kte text-charcoal">
    <div>
      <section className="relative flex items-center overflow-hidden bg-[radial-gradient(circle_at_80%_20%,rgb(198_138_30_/_0.12)_0,transparent_34%),radial-gradient(circle_at_12%_80%,rgb(29_29_31_/_0.05)_0,transparent_30%)] px-5 py-20 sm:py-24">
        <div className="kte-grid absolute inset-0 opacity-40"/><div className="mx-auto grid w-full max-w-7xl items-center gap-14 py-8 lg:grid-cols-[1fr_1.05fr] lg:px-8">
          <div className="relative z-10"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-card/80 px-4 py-2 text-xs font-bold text-charcoal shadow-sm"><Sparkles size={14} color={gold}/> THE BUSINESS ENGLISH STANDARD</div>
            <h1 className="font-serif-display max-w-2xl text-6xl leading-[.95] tracking-[-.03em] sm:text-7xl lg:text-[5.4rem]">Know the <span className="kte-gradient">test.</span><br/>Own your future.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">Everything you need to know about the Locrativ Business English proficiency test.</p>
            <p className="mt-3 text-sm text-muted-foreground/80">Designed for professionals, companies, and organizations.</p>
            <div className="mt-9 flex flex-wrap gap-3"><PillButton>Take the Exam <ArrowRight size={17}/></PillButton><PillButton outline href="/verify"><FileBadge2 size={17}/> Verify a Certificate</PillButton></div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[600px]">
            <div className="kte-orbit absolute inset-[8%] rounded-full border border-gold/20"/><div className="kte-orbit kte-delay absolute inset-[19%] rounded-full border border-charcoal/10"/>
            <div className="kte-float absolute left-[8%] top-[18%] z-20 rounded-2xl bg-card p-4 shadow-2xl"><ShieldCheck size={30} color={gold}/></div>
            <div className="kte-float kte-delay absolute right-[7%] top-[12%] z-20 rounded-2xl bg-card p-4 shadow-2xl"><Globe2 size={30} color={charcoal}/></div>
            <div className="kte-float absolute bottom-[13%] right-[10%] z-20 rounded-2xl bg-charcoal p-4 text-white shadow-2xl"><BriefcaseBusiness size={30}/></div>
            <div className="absolute inset-x-[7%] top-[23%] z-10 rotate-[-2deg] rounded-[2rem] border border-gold/20 bg-card/70 p-4 shadow-[0_40px_90px_-30px_rgb(29_29_31_/_.35)] backdrop-blur-xl"><div className="overflow-hidden rounded-2xl bg-charcoal p-5 text-white"><div className="mb-7 flex items-center justify-between"><b>LBE Dashboard</b><span className="size-2 rounded-full bg-gold"/></div><p className="text-xs text-white/55">YOUR CURRENT LEVEL</p><p className="mt-2 text-4xl font-semibold">LBE 3</p><p className="text-gold-soft">Professional</p><div className="mt-8 grid grid-cols-3 gap-2">{["Reading", "Speaking", "Writing"].map((x,i)=><div key={x} className="rounded-xl bg-white/10 p-3 text-[10px]"><div className="mb-2 h-1 rounded bg-gold" style={{width:`${72+i*8}%`}}/>{x}</div>)}</div></div></div>
            <div className="kte-float kte-delay absolute bottom-[5%] left-[2%] z-20 w-[48%] rotate-[-7deg] rounded-xl border border-gold/40 bg-ivory p-4 shadow-2xl"><Award className="mx-auto" color={gold}/><p className="mt-2 text-center text-[10px] tracking-[.2em] text-gold">CERTIFICATE</p><p className="text-center font-serif text-lg">Business English</p></div>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-6 px-5"><div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 rounded-3xl border border-gold/15 bg-card/90 p-3 shadow-card backdrop-blur-xl md:grid-cols-5">{[[Clock3,"Duration","60 Minutes"],[Target,"Questions","50 Questions"],[Award,"Levels","LBE 1–5"],[Clock3,"Results","48 Hours"],[FileBadge2,"Certificate","Verifiable"]].map(([I,a,b])=>{const Icon=I as typeof Clock3;return <div className="rounded-2xl p-4 text-center last:col-span-2 md:last:col-span-1" key={String(a)}><Icon className="mx-auto mb-2" size={20} color={gold}/><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{String(a)}</p><b className="mt-1 block text-sm">{String(b)}</b></div>})}</div></section>

      <section id="about" className="px-5 py-24"><SectionTitle eyebrow="One test. Real ability.">What is LBE?</SectionTitle><div className="mx-auto max-w-4xl text-center"><p className="text-xl text-muted-foreground">LBE measures one thing:</p><p className="font-serif-display mt-4 text-4xl sm:text-6xl">Your ability to <span className="kte-word">communicate</span><br/>professionally.</p></div><div className="mx-auto mt-16 grid max-w-6xl gap-5 md:grid-cols-3">{[[BookOpen,"Understand","Understand workplace English."],[MessageCircle,"Express","Express ideas professionally."],[Users2,"Communicate","Communicate confidently."]].map(([I,t,d],i)=>{const Icon=I as typeof BookOpen;return <article key={String(t)} className="kte-card"><span className="mb-8 grid size-12 place-items-center rounded-2xl bg-gold/10"><Icon color={gold}/></span><span className="text-xs font-bold text-gold">0{i+1}</span><h3 className="mt-2 text-2xl font-semibold">{String(t)}</h3><p className="mt-3 text-muted-foreground">{String(d)}</p></article>})}</div></section>

      <section className="bg-muted px-5 py-24"><SectionTitle eyebrow="Built for ambition">Who is it for?</SectionTitle><div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">{[[BriefcaseBusiness,"Professionals",["Find better jobs","Earn a promotion","Accelerate career growth"]],[Building2,"Companies",["Smarter hiring","Team assessment","Targeted training"]],[Users2,"Organizations",["Certification","Employee development","Benchmarking"]]].map(([I,t,items])=>{const Icon=I as typeof BriefcaseBusiness;return <article className="kte-card group overflow-hidden" key={String(t)}><div className="mb-8 flex h-40 items-end justify-center rounded-2xl bg-gradient-to-br from-gold/10 to-card"><Icon size={82} strokeWidth={1} className="transition group-hover:scale-110" color={charcoal}/></div><h3 className="text-2xl font-semibold">{String(t)}</h3><ul className="mt-4 space-y-3 text-sm text-muted-foreground">{(items as string[]).map(x=><li key={x} className="flex gap-2"><Check size={17} color={gold}/>{x}</li>)}</ul></article>})}</div></section>

      <section id="journey" className="relative overflow-hidden bg-charcoal-dark px-5 py-24"><div className="kte-dark-grid absolute inset-0"/><SectionTitle eyebrow="From registration to recognition" light>Your exam journey</SectionTitle><div className="relative mx-auto max-w-xl">{["Register","Prepare","Take Exam","AI Review","Human Review","Receive Certificate","Share with Employers"].map((x,i)=><div className="group relative flex gap-7 pb-9" key={x}><div className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full border border-gold/40 bg-charcoal text-sm font-bold text-gold-soft shadow-[0_0_0_7px_#202020] transition group-hover:bg-gold group-hover:text-white">{i+1}</div>{i<6&&<div className="absolute left-[23px] top-12 h-full w-px bg-gradient-to-b from-gold to-gold/10"/>}<div className="pt-2"><h3 className="text-xl font-semibold text-white">{x}</h3><p className="mt-1 text-sm text-white/45">{i<2?"Get set for success.":i<5?"Accurate, fair and carefully reviewed.":"Your achievement, ready to share."}</p></div></div>)}</div></section>

      <section className="px-5 py-24"><SectionTitle eyebrow="Five stages. One complete picture.">What&apos;s inside the exam?</SectionTitle><div className="mx-auto max-w-6xl space-y-3">{levels.map(([level,name],i)=><div key={level} className="group grid items-center gap-4 rounded-2xl border border-gold/10 bg-card p-5 transition hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl sm:grid-cols-[100px_1fr_auto]"><b>{level}</b><div><h3 className="font-semibold">{name}</h3><div className="mt-3 h-1 max-w-xl overflow-hidden rounded-full bg-gold/15"><div className="h-full bg-gold transition-all group-hover:w-full" style={{width:`${30+i*15}%`}}/></div><p className="max-h-0 overflow-hidden text-xs text-muted-foreground opacity-0 transition-all group-hover:mt-3 group-hover:max-h-10 group-hover:opacity-100">Real-world scenarios, vocabulary and communication tasks.</p></div><span className="text-sm text-muted-foreground">10 Questions</span></div>)}</div></section>

      <section id="skills" className="bg-muted px-5 py-24"><div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2"><div><p className="eyebrow mb-3">A 360° evaluation</p><h2 className="font-serif-display text-4xl sm:text-5xl">Skills we measure</h2><div className="relative mx-auto mt-12 aspect-square max-w-md"><div className="kte-radar absolute inset-[15%] rotate-45 border border-gold/30"/><div className="kte-radar absolute inset-[28%] rotate-45 border border-gold/20"/><div className="absolute inset-[39%] grid place-items-center rounded-full bg-gold text-center text-xs font-bold text-white shadow-[0_0_35px_rgb(198_138_30_/_.53)]">LBE<br/>PROFILE</div>{[Languages,BookOpen,Headphones,PenLine,Mic2,MessageCircle].map((I,i)=><span key={i} className="absolute grid size-11 place-items-center rounded-full bg-card shadow-lg" style={{left:`${50+41*Math.cos(i*Math.PI/3)}%`,top:`${50+41*Math.sin(i*Math.PI/3)}%`,transform:"translate(-50%,-50%)"}}><I size={19} color={gold}/></span>)}</div></div><div className="space-y-3">{["Business English Proficiency","Speaking","Listening","Reading","Writing","Workplace Communication"].map((x,i)=><div key={x} className="flex items-center justify-between rounded-2xl border border-gold/10 bg-card p-5 shadow-sm transition hover:translate-x-2"><span className="flex items-center gap-3"><b className="text-xs text-gold">0{i+1}</b>{x}</span><ArrowRight size={18}/></div>)}</div></div></section>

      <section className="overflow-hidden px-5 py-24"><SectionTitle eyebrow="English in context">Business topics</SectionTitle><div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3">{topics.map((x,i)=><span key={x} className={`kte-chip ${i%3===0?"bg-charcoal text-white":"bg-gold/10 text-charcoal"}`}>{x}</span>)}</div></section>

      <section className="bg-muted px-5 py-24"><SectionTitle eyebrow="Technology with judgment">AI + Human Review</SectionTitle><div className="mx-auto grid max-w-6xl items-center gap-7 lg:grid-cols-[1fr_auto_1fr]"><div className="kte-card text-center"><div className="mx-auto grid size-28 place-items-center rounded-full bg-charcoal text-white"><Sparkles size={48}/></div><h3 className="mt-6 text-2xl font-semibold">AI Evaluation</h3><p className="mt-2 text-sm text-muted-foreground">Fast, consistent analysis across every response.</p></div><div className="flex items-center justify-center text-gold lg:flex-col"><ArrowRight className="lg:rotate-90"/><span className="m-3 rounded-full bg-card px-4 py-2 text-xs font-bold shadow">THEN</span><ArrowRight className="lg:rotate-90"/></div><div className="kte-card text-center"><div className="mx-auto grid size-28 place-items-center rounded-full bg-card shadow-inner"><Users2 size={48} color={charcoal}/></div><h3 className="mt-6 text-2xl font-semibold">Human Review</h3><p className="mt-2 text-sm text-muted-foreground">Professional examiners confirm every final score.</p></div></div></section>

      <section id="security" className="relative overflow-hidden bg-charcoal-dark px-5 py-24"><div className="kte-dark-grid absolute inset-0"/><SectionTitle eyebrow="Trust built in" light>Secure from start to certificate.</SectionTitle><div className="relative mx-auto mb-14 grid size-32 place-items-center rounded-[2.2rem] border border-gold/40 bg-charcoal text-white shadow-[0_0_70px_rgb(198_138_30_/_.33)]"><ShieldCheck size={62}/></div><div className="relative mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-3">{[[Users2,"Identity Verification"],[Sparkles,"AI Monitoring"],[LockKeyhole,"Browser Protection"],[Target,"Random Questions"],[Users2,"Human Review"],[FileBadge2,"Verified Certificate"]].map(([I,x])=>{const Icon=I as typeof Users2;return <div key={String(x)} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-white backdrop-blur transition hover:border-gold/50 hover:bg-white/10"><Icon color={goldSoft}/><b>{String(x)}</b></div>})}</div></section>

      <section className="px-5 py-24"><SectionTitle eyebrow="Made for the workplace">Why choose LBE?</SectionTitle><div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-gold/15">{["Business English","Workplace Communication","AI Speaking Assessment","AI Writing Assessment","Human Review","Digital Verification","Employer Dashboard"].map((x,i)=><div key={x} className={`flex items-center justify-between p-5 ${i%2?"bg-ivory":"bg-card"}`}><span className="font-medium">{x}</span><span className="grid size-7 place-items-center rounded-full bg-gold text-white"><Check size={16}/></span></div>)}</div></section>

      <section className="relative overflow-hidden px-5 py-28 text-center"><Globe2 className="absolute left-1/2 top-1/2 -z-0 -translate-x-1/2 -translate-y-1/2 text-gold/5" size={700} strokeWidth={.5}/><div className="relative z-10 mx-auto max-w-4xl"><p className="eyebrow">Your next chapter starts here</p><h2 className="font-serif-display mt-6 text-5xl sm:text-7xl">Ready to prove your Business English?</h2><p className="mx-auto mt-6 max-w-xl text-muted-foreground">Take the Locrativ Business English proficiency test.</p><div className="mt-9 flex flex-wrap justify-center gap-3"><PillButton>Take the Exam <ArrowRight size={17}/></PillButton><PillButton outline href="#about"><Play size={16}/> Learn More</PillButton></div></div></section>
    </div>
  </div></PageShell>;
}
