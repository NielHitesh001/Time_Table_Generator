import { COMPLETED_DEFAULT, uniqueCourses, COURSE_INDEX, facultyOf, slotLabel, type Offering } from "@/lib/catalog";
import { usePlanner } from "@/lib/store";
import { clashWith, duplicateCode } from "@/lib/solver";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Ban, Lock, LockOpen, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

const FILTERS = [
  { id: "aiml", label: "AIML first" },
  { id: "core", label: "Cores" },
  { id: "basket", label: "Baskets" },
  { id: "open", label: "Open / SSK" },
  { id: "all", label: "All" },
] as const;

export function CatalogPanel() {
  const selected = usePlanner((s) => s.selected);
  const options = usePlanner((s) => s.options);
  const addOffering = usePlanner((s) => s.addOffering);
  const swapOffering = usePlanner((s) => s.swapOffering);
  const toggleLock = usePlanner((s) => s.toggleLock);
  const toggleBan = usePlanner((s) => s.toggleBan);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("aiml");
  const [msg, setMsg] = useState<string | null>(null);

  const courses = uniqueCourses();
  const completed = new Set(options.excludeCompleted ? COMPLETED_DEFAULT.map((c) => c.code) : []);

  const visible = useMemo(() => {
    return courses.filter((c) => {
      if (completed.has(c.code)) return false;
      if (options.excludePg && c.group === "pg") return false;
      if (filter === "core" && c.group !== "core" && c.group !== "math") return false;
      if (filter === "basket" && c.group !== "basket") return false;
      if (filter === "open" && c.group !== "open" && c.group !== "soft") return false;
      if (filter === "aiml" && c.aimlScore < 48) return false;
      if (!q.trim()) return true;
      const hay = `${c.code} ${c.name} ${c.category} ${c.basket ?? ""}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [courses, completed, options.excludePg, filter, q]);

  const pick = (offering: Offering) => {
    const err = duplicateCode(selected, offering)
      ? swapOffering(offering)
      : addOffering(offering);
    setMsg(err);
    if (err) window.setTimeout(() => setMsg(null), 2800);
  };

  return (
    <section className="no-print rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Fall 2026 catalog</p>
          <h2 className="font-display text-2xl font-medium tracking-tight">Offerings</h2>
        </div>
        <p className="text-xs text-muted">{visible.length} courses</p>
      </div>

      <label className="mb-3 flex h-11 items-center gap-2 rounded-md bg-bg px-3 shadow-[var(--shadow-border)]">
        <Search className="size-4 text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search code, title, faculty…"
          className="h-full w-full bg-transparent text-sm outline-none placeholder:text-faint"
        />
      </label>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "h-9 rounded-sm px-3 text-xs font-medium",
              filter === f.id ? "bg-navy text-surface" : "bg-bg text-ink-soft hover:text-ink",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {msg ? <p className="mb-3 text-sm text-danger">{msg}</p> : null}

      <ul className="grid gap-2">
        {visible.map((head) => {
          const offerings = COURSE_INDEX.get(head.code) ?? [];
          const onGrid = selected.find((s) => s.code === head.code);
          const locked = options.lockedCodes.includes(head.code);
          const banned = options.bannedCodes.includes(head.code);
          return (
            <li key={head.code} className="rounded-md bg-bg p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-medium text-navy">{head.code}</span>
                    <Badge tone={head.group === "basket" ? "sage" : head.group === "core" ? "navy" : "neutral"}>
                      {head.category}
                    </Badge>
                    <span className="font-mono text-xs text-muted">{head.credits} cr</span>
                    {head.aimlScore >= 80 ? <Badge tone="ok">AIML</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm font-medium leading-snug text-ink">{head.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-label={locked ? "Unlock" : "Lock in next generate"}
                    onClick={() => toggleLock(head.code)}
                  >
                    {locked ? <Lock className="size-4" /> : <LockOpen className="size-4 text-faint" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-label={banned ? "Allow" : "Exclude"}
                    onClick={() => toggleBan(head.code)}
                  >
                    <Ban className={cn("size-4", banned ? "text-danger" : "text-faint")} />
                  </Button>
                </div>
              </div>
              <ul className="mt-2 grid gap-1.5">
                {offerings.map((o) => {
                  const clash = clashWith(selected.filter((s) => s.code !== o.code), o);
                  const active = onGrid?.id === o.id;
                  return (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-sm bg-surface px-2 py-1.5">
                      <p className="min-w-0 text-xs text-ink-soft">
                        <span className="font-mono text-ink">{slotLabel(o)}</span>
                        <span className="mx-2 text-faint">·</span>
                        {facultyOf(o)}
                        {o.incomplete ? <span className="ml-2 text-warn">theory TBA</span> : null}
                      </p>
                      <Button
                        variant={active ? "primary" : "secondary"}
                        size="sm"
                        className="h-8 px-2.5"
                        disabled={clash && !active}
                        onClick={() => pick(o)}
                      >
                        <Plus className="size-3.5" />
                        {active ? "On grid" : clash ? "Clash" : "Add"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
