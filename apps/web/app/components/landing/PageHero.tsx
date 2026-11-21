import type { ReactNode } from "react";
import { Spotlight } from "./Spotlight";

/** Page header for the inner public pages: smaller beams over a left-aligned
 *  title. `children` sits under the subtitle (role pickers, actions…). */
export function PageHero({
  title,
  subtitle,
  children,
  aside,
}: {
  title: ReactNode;
  subtitle: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border pt-32 pb-14 sm:pt-36 lg:pb-20">
      <Spotlight size="page" />
      <div
        className={`hero-rise mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 ${
          aside ? "grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]" : ""
        }`}
      >
        <div>
          <h1 className="max-w-[20ch] font-heading text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[1.05] tracking-[-0.035em] text-balance text-foreground">
            {title}
          </h1>
          <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-foreground-body sm:text-lg">
            {subtitle}
          </p>
          {children}
        </div>
        {aside}
      </div>
    </section>
  );
}
