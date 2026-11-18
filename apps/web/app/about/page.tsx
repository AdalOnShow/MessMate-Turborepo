import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { AboutContent } from "../components/about/AboutContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/** Public about page: reachable logged in or out (see `publicRoutes` in proxy.ts). */
export default function AboutPage() {
  return (
    <div className="landing-dark min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
      <Navbar />
      <main className="pt-[60px]">
        <AboutContent />
      </main>
      <Footer />
    </div>
  );
}
