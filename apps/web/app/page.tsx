import { Navbar } from "./components/landing/Navbar";
import { HeroSection } from "./components/landing/HeroSection";
import { StatsSection } from "./components/landing/StatsSection";
import { FeaturesSection } from "./components/landing/FeaturesSection";
import { HowItWorksSection } from "./components/landing/HowItWorksSection";
import { PricingSection } from "./components/landing/PricingSection";
import { Footer } from "./components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30 selection:text-foreground">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}
