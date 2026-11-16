import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/app/lib/utils";

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
      className={cn(
        "rounded-2xl border border-border bg-surface",
        interactive &&
          "transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-raised",
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
  eyebrow,
  action,
}: {
  icon?: ReactNode;
  title: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-raised text-primary [&_svg]:size-4">
            {icon}
          </span>
        )}
        <div>
          {eyebrow && (
            <p className="label-mono text-[10px] text-foreground-muted">
              {eyebrow}
            </p>
          )}
          <h3 className="text-sm font-bold tracking-tight text-foreground">
            {title}
          </h3>
        </div>
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
