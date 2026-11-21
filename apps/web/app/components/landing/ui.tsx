import type { ReactNode } from "react";

/** Rich-text tags for translated headings: `<accent>word</accent>` → blue highlight.
 *  Used by the guide, install and about pages; the landing page no longer accents words. */
export const richAccent = {
  accent: (chunks: ReactNode) => <span className="text-primary">{chunks}</span>,
  br: () => <br />,
};

/** For translated titles that still carry `<accent>` tags: the public pages
 *  no longer color one word, so the tag renders as plain text. */
export const plainRich = {
  accent: (chunks: ReactNode) => <>{chunks}</>,
  br: () => <br />,
};

/** Page-width wrapper shared by every landing section. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

/** A plain, left-aligned section heading: no eyebrow, no accented word. */
export function SectionHeading({
  title,
  subtitle,
  id,
}: {
  title: string;
  subtitle?: string;
  id?: string;
}) {
  return (
    <div className="max-w-3xl">
      <h2
        id={id}
        className="font-heading text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-balance text-foreground"
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-foreground-muted sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function Avatar({
  initials,
  className = "",
}: {
  initials: string;
  className?: string;
}) {
  const palette = [
    "bg-primary/15 text-primary",
    "bg-accent-warm/15 text-accent-warm",
    "bg-success/15 text-success",
    "bg-destructive/15 text-destructive",
  ];
  const hueIndex =
    initials.charCodeAt(0) +
    (initials.charCodeAt(1) || 0) +
    (initials.charCodeAt(2) || 0);
  return (
    <span
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        palette[hueIndex % palette.length]
      } ${className}`}
    >
      {initials}
    </span>
  );
}
