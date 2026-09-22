import type { Offering } from "@/lib/catalog";
import { facultyOf, lpc, slotLabel } from "@/lib/catalog";
import { selectedStats } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { colorForCode } from "@/components/timetable-grid";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useMemo, useState } from "react";

export function PlanSummary({ selected, onRemove }: { selected: Offering[]; onRemove: (code: string) => void }) {
  const stats = selectedStats(selected);
  const codes = selected.map((o) => o.code);
  const [copied, setCopied] = useState(false);

  const grouped = useMemo(() => {
    const rows: { o: Offering; i: number }[] = selected.map((o, i) => ({ o, i }));
    return rows;
  }, [selected]);

  const copyList = async () => {
    const lines = [
      "Code\tTitle\tCredits\tType\tSlot\tFaculty",
      ...selected.map((o) => {
        const type = o.lecture && o.practical ? "TEL" : o.practical ? "P" : "T";
        return `${o.code}\t${o.name}\t${o.credits}\t${type}\t${slotLabel(o)}\t${facultyOf(o)}`;
      }),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] print-block sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Course registration summary</p>
          <h2 className="font-display text-2xl font-medium tracking-tight text-ink">Ready for SCFAS</h2>
        </div>
        <Button variant="secondary" size="sm" className="no-print" onClick={copyList}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy list"}
        </Button>
      </div>

      <div className="w-full max-w-full overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Code</th>
              <th className="py-2 pr-3">Title</th>
              <th className="py-2 pr-3">Cr</th>
              <th className="py-2 pr-3">LPC</th>
              <th className="py-2 pr-3">Slot</th>
              <th className="py-2 pr-3">Faculty</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ o }, i) => (
              <tr key={o.id} className="border-b border-line/80 last:border-0">
                <td className="py-2.5 pr-3 font-mono text-xs text-faint">{i + 1}</td>
                <td className="py-2.5 pr-3">
                  <span className="inline-flex items-center gap-2">
                    <span className={`size-2.5 rounded-sm ${colorForCode(o.code, codes)}`} />
                    <span className="font-mono text-xs font-medium">{o.code}</span>
                  </span>
                </td>
                <td className="max-w-[220px] py-2.5 pr-3">
                  <p className="leading-snug text-ink">{o.name}</p>
                  <p className="text-xs text-muted">{o.category}</p>
                </td>
                <td className="py-2.5 pr-3 font-mono tabular-nums">{o.credits}</td>
                <td className="py-2.5 pr-3 font-mono text-xs text-muted">{lpc(o)}</td>
                <td className="py-2.5 pr-3 font-mono text-xs">{slotLabel(o)}</td>
                <td className="py-2.5 pr-3 text-xs text-ink-soft">{facultyOf(o)}</td>
                <td className="py-2.5">
                  <button
                    type="button"
                    className="no-print text-xs text-muted underline-offset-2 hover:text-danger hover:underline"
                    onClick={() => onRemove(o.code)}
                  >
                    Remove
                  </button>
                  <Badge tone="ok" className="print:inline-flex hidden">
                    Planned
                  </Badge>
                </td>
              </tr>
            ))}
            {selected.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-muted">
                  No courses yet. Generate a plan or pick from the catalog.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-2 rounded-md bg-bg px-3 py-3 text-sm sm:grid-cols-3">
        <Stat label="Credits" value={`${stats.credits}`} hint={stats.credits >= 24 && stats.credits <= 26 ? "In band" : "Adjust"} />
        <Stat label="Gaps" value={`${stats.gaps}`} hint="Empty periods inside a session" />
        <Stat label="AIML score" value={`${Math.round(stats.aimlScore / 10)}`} hint="Relevance × credits" />
      </div>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="font-mono text-lg tabular-nums text-ink">{value}</p>
      <p className="text-xs text-faint">{hint}</p>
    </div>
  );
}
