import { PublicShell } from "../components/landing/PublicShell";
import { HeroSection } from "../components/landing/HeroSection";
import { ProblemSection } from "../components/landing/ProblemSection";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { AccountingSection } from "../components/landing/AccountingSection";
import { FAQSection } from "../components/landing/FAQSection";
import { FinalCTASection } from "../components/landing/FinalCTASection";

export default function HomePage() {
  return (
    <PublicShell>
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AccountingSection />
      <FAQSection />
      <FinalCTASection />
    </PublicShell>
  );
}
