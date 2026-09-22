import { createFileRoute } from "@tanstack/react-router";
import { CatalogPanel } from "@/components/catalog-panel";
import { ControlsPanel } from "@/components/controls-panel";
import { CreditMeter } from "@/components/credit-meter";
import { PlanSummary } from "@/components/plan-summary";
import { TimetableGrid } from "@/components/timetable-grid";
import { catalog } from "@/lib/catalog";
import { usePlanner, selectedStats } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const selected = usePlanner((s) => s.selected);
  const removeCode = usePlanner((s) => s.removeCode);
  const generate = usePlanner((s) => s.generate);
  const plans = usePlanner((s) => s.plans);
  const activeIndex = usePlanner((s) => s.activeIndex);
  const stats = selectedStats(selected);
  const inBand = stats.credits >= 24 && stats.credits <= 26;
  const active = plans[activeIndex];

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="masthead-rule h-1 w-full" />
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
              {catalog.system} · {catalog.university}
            </p>
            <h1 className="font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
              ClearSlot
            </h1>
            <p className="mt-1 max-w-xl text-sm text-ink-soft">
              Fall 2026 AIML registration — cores and electives with zero overlaps, no repeated
              subjects, {catalog.academicYear} credit band 24–26.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="navy">{catalog.program}</Badge>
            <Badge tone="sage">{catalog.semester}</Badge>
            <Button variant="secondary" size="sm" className="no-print" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-5 grid gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:grid-cols-[1fr_auto] sm:p-5">
          <CreditMeter credits={stats.credits} />
          <dl className="grid grid-cols-3 gap-3 sm:min-w-64">
            <Metric label="Clashes" value={stats.clashes === 0 ? "None" : String(stats.clashes)} ok={stats.clashes === 0} />
            <Metric label="Gaps" value={String(stats.gaps)} ok={stats.gaps <= 6} />
            <Metric label="Days" value={String(stats.daysUsed)} ok />
          </dl>
        </section>

        {active ? (
          <p className="mb-4 text-sm text-ink-soft">
            Showing <span className="font-medium text-ink">{active.label}</span>
            {inBand ? " — credit target met." : " — adjust until you sit between 24 and 26."}{" "}
            <button type="button" className="no-print text-navy underline-offset-2 hover:underline" onClick={generate}>
              Regenerate
            </button>
          </p>
        ) : null}

        <TimetableGrid selected={selected} onRemove={removeCode} />

        <div className="mt-3 no-print flex flex-wrap items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-theory" /> Theory
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-lab" /> Lab
          </span>
          <span>Hatched cells are occupied by the other component at that time.</span>
          <span>Click a filled cell to drop the course.</span>
        </div>

        <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(16rem,2fr)]">
          <PlanSummary selected={selected} onRemove={removeCode} />
          <ControlsPanel />
        </div>

        <WhyPlan />

        <div className="mt-5">
          <CatalogPanel />
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className={`font-mono text-lg tabular-nums ${ok ? "text-ok" : "text-warn"}`}>{value}</dd>
    </div>
  );
}

function WhyPlan() {
  const selected = usePlanner((s) => s.selected);
  const options = usePlanner((s) => s.options);
  if (selected.length === 0) return null;
  const baskets = [...new Set(selected.map((o) => o.basket).filter(Boolean))];
  const aiml = selected.filter((o) => o.aimlScore >= 80);
  return (
    <section className="mt-5 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5 print-block">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Why this grid</p>
      <h2 className="font-display text-2xl font-medium tracking-tight">Selection logic</h2>
      <ul className="mt-3 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
        <li>
          Weighted toward AIML: {aiml.map((o) => o.code).join(", ") || "mix in catalog"} with
          supporting math and program cores.
        </li>
        <li>
          {options.excludeCompleted
            ? "Courses already on your SCFAS history are excluded so nothing repeats."
            : "Completed-course filter is off — check for repeats before you register."}
        </li>
        <li>
          Slot engine treats every theory hour and lab pair as a 50-minute cell. Two courses never
          share a cell.
        </li>
        <li>
          Gaps are empty periods inside morning or afternoon — lunch is not counted. Baskets in this
          mix: {baskets.length ? baskets.join(", ") : "general cores / electives"}.
        </li>
      </ul>
    </section>
  );
}
