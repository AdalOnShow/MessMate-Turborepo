import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { InstallGuide } from "../components/install/InstallGuide";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("install");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/** Public install guide: reachable logged in or out (see `publicRoutes` in proxy.ts). */
export default function InstallPage() {
  return (
    <div className="landing-dark min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
      <Navbar />
      <main className="pt-[60px]">
        <InstallGuide />
      </main>
      <Footer />
    </div>
  );
}
