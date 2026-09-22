import { COMPLETED_DEFAULT } from "@/lib/catalog";
import { usePlanner } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarCheck, RotateCcw } from "lucide-react";

export function ControlsPanel() {
  const options = usePlanner((s) => s.options);
  const setOption = usePlanner((s) => s.setOption);
  const generate = usePlanner((s) => s.generate);
  const reset = usePlanner((s) => s.reset);
  const plans = usePlanner((s) => s.plans);
  const activeIndex = usePlanner((s) => s.activeIndex);
  const applyPlan = usePlanner((s) => s.applyPlan);

  return (
    <section className="no-print rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Optimizer</p>
      <h2 className="font-display text-2xl font-medium tracking-tight">Constraints</h2>
      <p className="mt-1 text-sm text-muted">
        Built from the Fall 2026 student copy. Already-taken SCFAS courses stay out by default so subjects do not repeat.
      </p>

      <div className="mt-4 grid gap-2">
        <Toggle
          label="AIML-weighted cores & electives"
          hint="Machine learning, stats, analytics, crypto, cloud"
          on={options.aimlFocus}
          onChange={(v) => setOption("aimlFocus", v)}
        />
        <Toggle
          label="Skip completed courses"
          hint={`${COMPLETED_DEFAULT.length} codes from your 2024–26 history`}
          on={options.excludeCompleted}
          onChange={(v) => setOption("excludeCompleted", v)}
        />
        <Toggle
          label="Hide M.Tech offerings"
          hint="CSE5xxx / postgraduate baskets"
          on={options.excludePg}
          onChange={(v) => setOption("excludePg", v)}
        />
        <Toggle
          label="Include aptitude / SSK labs"
          hint="Fills the last credit without a theory clash"
          on={options.includeSoftSkills}
          onChange={(v) => setOption("includeSoftSkills", v)}
        />
        <Toggle
          label="Prefer morning theory"
          hint="Soft bias — compactness still wins clashes"
          on={options.preferMorning}
          onChange={(v) => setOption("preferMorning", v)}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={generate} className="min-h-11">
          <CalendarCheck className="size-4" />
          Generate optimal plan
        </Button>
        <Button variant="ghost" onClick={reset}>
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>

      {plans.length > 0 ? (
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Alternatives</p>
          <div className="grid gap-2">
            {plans.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPlan(i)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-left transition-colors",
                  i === activeIndex ? "bg-navy text-surface" : "bg-bg text-ink hover:bg-surface-2",
                )}
              >
                <span className="block text-sm font-medium">{p.label}</span>
                <span className={cn("block font-mono text-xs", i === activeIndex ? "text-surface/70" : "text-muted")}>
                  {p.credits} cr · {p.gaps} gaps · {p.daysUsed} days · compact {p.compactness}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-warn">No clash-free mix hit 24–26 with these locks. Unlock a course or widen filters.</p>
      )}
    </section>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-3 rounded-md bg-bg px-3 py-2.5 text-left"
    >
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <span
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors",
          on ? "bg-navy" : "bg-line-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-surface transition-transform",
            on ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
