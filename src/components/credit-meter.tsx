import { cn } from "@/lib/utils";

export function CreditMeter({ credits, min = 24, max = 26 }: { credits: number; min?: number; max?: number }) {
  const pct = Math.min(100, (credits / 30) * 100);
  const inRange = credits >= min && credits <= max;
  const over = credits > max;
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Credit load</p>
        <p className="font-mono text-sm tabular-nums text-ink">
          <span className={cn("text-lg font-medium", inRange ? "text-ok" : over ? "text-danger" : "text-warn")}>
            {credits}
          </span>
          <span className="text-faint"> / {min}–{max}</span>
        </p>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-navy transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 bg-ok/35"
          style={{ left: `${(min / 30) * 100}%`, width: `${((max - min) / 30) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        {inRange
          ? "Inside the target band."
          : over
            ? "Over 26 — drop a course before registering."
            : credits === 0
              ? "Generate a plan to fill the grid."
              : `Need ${min - credits} more credit${min - credits === 1 ? "" : "s"} to hit the floor.`}
      </p>
    </div>
  );
}
