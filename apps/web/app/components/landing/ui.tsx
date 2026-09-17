import type { ReactNode } from "react";

export function SectionEyebrow({
  children,
  align = "center",
}: {
  children: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary ${
        align === "center" ? "mx-auto" : ""
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_2px_rgba(6,182,212,0.6)]" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={`max-w-3xl ${
        align === "center" ? "mx-auto text-center" : "text-left"
      } space-y-4`}
    >
      <SectionEyebrow align={align}>{eyebrow}</SectionEyebrow>
      <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-foreground font-heading leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base sm:text-lg text-foreground-muted font-light leading-relaxed">
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
