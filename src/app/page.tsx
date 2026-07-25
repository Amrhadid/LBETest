import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ScoreSystem } from "@/components/home/ScoreSystem";
import { VerifyCertificate } from "@/components/home/VerifyCertificate";
import { Audiences } from "@/components/home/Audiences";
import { Pricing } from "@/components/home/Pricing";
import { Faq } from "@/components/home/Faq";
import { FinalCta } from "@/components/home/FinalCta";
import { Footer } from "@/components/home/Footer";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1">
        <Hero />
        <HowItWorks />
        <ScoreSystem />
        <VerifyCertificate />
        <Audiences />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
