import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function BentoCard({
  children,
  className,
  interactive = false,
  ...props
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
} & Omit<ComponentProps<"div">, "className">) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-foreground-muted/10 bg-surface shadow-sm",
        interactive &&
          "transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground-muted/20 hover:shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeading({
  icon,
  title,
  action,
}: {
  icon?: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {action}
    </div>
  );
}

export function CardActionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
    >
      {children}
    </Link>
  );
}
