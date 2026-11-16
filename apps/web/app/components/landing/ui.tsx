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
      className={`label-mono inline-block text-primary ${
        align === "center" ? "mx-auto" : ""
      }`}
    >
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
      <h2 className="heading-tight text-[clamp(1.75rem,3.2vw,2.625rem)] text-foreground">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base sm:text-lg text-foreground-muted leading-relaxed">
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
