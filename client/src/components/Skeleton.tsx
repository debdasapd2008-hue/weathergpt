import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-xl bg-ink/[0.07] dark:bg-white/[0.07]", className)}
    />
  );
}

export function WeatherSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading weather">
      <div className="panel animate-fade-in p-6 sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-12 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-20 w-20 rounded-3xl" />
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>

      <div className="panel animate-fade-in p-5">
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="flex gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 min-w-[76px] flex-1 rounded-2xl" />
          ))}
        </div>
      </div>

      <div className="panel animate-fade-in p-5">
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>
    </div>
  );
}