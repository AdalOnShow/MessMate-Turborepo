import { Wrench } from "lucide-react";
import { SectionHeading } from "./ui";
import { Reveal } from "./Reveal";

const STACK = [
  {
    name: "Next.js 16",
    color: "text-foreground bg-foreground/5 ring-foreground/15",
  },
  { name: "TypeScript", color: "text-primary bg-primary/10 ring-primary/25" },
  {
    name: "NestJS",
    color: "text-destructive bg-destructive/10 ring-destructive/25",
  },
  { name: "Prisma ORM", color: "text-success bg-success/10 ring-success/25" },
  { name: "PostgreSQL", color: "text-primary bg-primary/10 ring-primary/25" },
  {
    name: "Turborepo",
    color: "text-accent-warm bg-accent-warm/10 ring-accent-warm/25",
  },
  {
    name: "TanStack Query",
    color: "text-destructive bg-destructive/10 ring-destructive/25",
  },
  { name: "Tailwind CSS", color: "text-primary bg-primary/10 ring-primary/25" },
];

export function TechnologySection() {
  return (
    <section className="border-y border-foreground-muted/10 bg-surface py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            eyebrow="Built To Last"
            title={
              <>
                Stack You Can <span className="text-primary">Trust</span>
              </>
            }
            subtitle="A modern, deliberately boring stack — fast to ship, easy to keep honest, and pleasant to maintain. No bloat, no mystery."
          />
        </div>

        <Reveal delay={120}>
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-3">
            {STACK.map((tech) => (
              <span
                key={tech.name}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 ${tech.color}`}
              >
                <Wrench className="size-3.5" />
                {tech.name}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
