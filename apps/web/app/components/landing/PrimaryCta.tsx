import { getTranslations } from "next-intl/server";
import { ArrowRight, Download } from "lucide-react";
import { cn } from "../../lib/utils";

/** Landing primary CTA. On phones the first goal is getting the app onto the
 *  home screen, so below `md` it links to the install guide; on larger screens
 *  it stays "Get Started Free". Switched with CSS so there is no hydration flicker. */
export async function PrimaryCta({ className }: { className?: string }) {
  const tc = await getTranslations("common");
  const base = cn(
    "bg-cta group items-center justify-center gap-2 font-bold",
    className,
  );
  return (
    <>
      <a href="/install" className={cn(base, "inline-flex md:hidden")}>
        <Download className="size-4" />
        {tc("installApp")}
      </a>
      <a href="/signup" className={cn(base, "hidden md:inline-flex")}>
        {tc("getStartedFree")}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </a>
    </>
  );
}
