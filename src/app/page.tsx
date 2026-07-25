import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import { LogoRow } from "@/components/home/LogoRow";
import { Features } from "@/components/home/Features";
import { HowItWorks } from "@/components/home/HowItWorks";
import { VerifyCertificate } from "@/components/home/VerifyCertificate";
import { AudienceCards } from "@/components/home/AudienceCards";
import { SampleQuestion } from "@/components/home/SampleQuestion";
import { PricingTeaser } from "@/components/home/PricingTeaser";
import { Faq } from "@/components/home/Faq";
import { FinalCta } from "@/components/home/FinalCta";
import { Footer } from "@/components/home/Footer";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1">
        <Hero />
        <LogoRow />
        <Features />
        <HowItWorks />
        <SampleQuestion />
        <VerifyCertificate />
        <AudienceCards />
        <PricingTeaser />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
