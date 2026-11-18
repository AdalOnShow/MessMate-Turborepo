import { Navbar } from "../components/landing/Navbar";
import { HeroSection } from "../components/landing/HeroSection";
import { ProblemSection } from "../components/landing/ProblemSection";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { AccountingSection } from "../components/landing/AccountingSection";
import { ProductPreviewSection } from "../components/landing/ProductPreviewSection";
import { ActivitySection } from "../components/landing/ActivitySection";
import { RoleSection } from "../components/landing/RoleSection";
import { MonthFlowSection } from "../components/landing/MonthFlowSection";
import { TechnologySection } from "../components/landing/TechnologySection";
import { FreeSection } from "../components/landing/FreeSection";
import { FAQSection } from "../components/landing/FAQSection";
import { FinalCTASection } from "../components/landing/FinalCTASection";
import { Footer } from "../components/landing/Footer";

export default function HomePage() {
  return (
    <div className="landing-dark min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AccountingSection />
      <ProductPreviewSection />
      <ActivitySection />
      <RoleSection />
      <MonthFlowSection />
      <TechnologySection />
      <FreeSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
