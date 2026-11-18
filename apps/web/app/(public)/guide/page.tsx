import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Navbar } from "../../components/landing/Navbar";
import { Footer } from "../../components/landing/Footer";
import { UserGuide } from "../../components/guide/UserGuide";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guide");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/** Public user guide: reachable logged in or out (see `publicRoutes` in proxy.ts). */
export default function GuidePage() {
  return (
    <div className="landing-dark min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
      <Navbar />
      <main className="pt-[60px]">
        <UserGuide />
      </main>
      <Footer />
    </div>
  );
}
