import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EditorialLabel } from "@/components/Editorial";
import { cn } from "@/lib/cn";

export function PageHeader({
  icon: Icon,
  title,
  intro,
  index,
}: {
  icon: LucideIcon;
  title: string;
  intro?: string;
  index?: string;
}) {
  return (
    <header className="animate-fade-up mb-6">
      <EditorialLabel index={index}>
        <span className="inline-flex items-center gap-1.5">
          <Icon size={13} aria-hidden="true" />
          {title}
        </span>
      </EditorialLabel>
      <h1 className="mt-3 font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink dark:text-white sm:text-[2.6rem]">
        {title}
      </h1>
      {intro && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2 dark:text-white/55">
          {intro}
        </p>
      )}
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("panel animate-fade-up p-5", className)}>{children}</div>;
}

export function CardGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>;
}