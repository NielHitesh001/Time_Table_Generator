import type { ReactNode } from "react";
import { DAYS, LAB_BLOCKS, LAB_BLOCK_PERIODS, PERIODS, THEORY_GRID, cellIndex } from "@/lib/slots";
import type { Offering } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const COURSE_COLORS = [
  "bg-course-0",
  "bg-course-1",
  "bg-course-2",
  "bg-course-3",
  "bg-course-4",
  "bg-course-5",
  "bg-course-6",
  "bg-course-7",
  "bg-course-8",
  "bg-course-9",
];

export function colorForCode(code: string, codes: string[]) {
  const i = Math.max(0, codes.indexOf(code));
  return COURSE_COLORS[i % COURSE_COLORS.length];
}

function occupiedMap(selected: Offering[]) {
  const map = new Map<number, Offering>();
  for (const o of selected) {
    for (const c of o.cells) map.set(c, o);
  }
  return map;
}

export function TimetableGrid({
  selected,
  onRemove,
}: {
  selected: Offering[];
  onRemove?: (code: string) => void;
}) {
  const codes = selected.map((o) => o.code);
  const occ = occupiedMap(selected);

  return (
    <div className="w-full max-w-full overflow-x-auto rounded-xl bg-surface p-2 shadow-[var(--shadow-border)] print-block">
      <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            <th className="w-16 bg-navy px-2 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-surface/80 first:rounded-tl-lg">
              Day
            </th>
            <th
              colSpan={4}
              className="bg-navy px-2 py-2.5 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-surface"
            >
              Morning
            </th>
            <th className="w-9 bg-navy-deep px-1 py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-surface/70">
              Lunch
            </th>
            <th
              colSpan={4}
              className="bg-navy px-2 py-2.5 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-surface last:rounded-tr-lg"
            >
              Afternoon
            </th>
          </tr>
          <tr>
            <th className="bg-navy-deep px-2 py-1.5 text-[10px] font-medium text-surface/50" />
            {PERIODS.slice(0, 4).map((p) => (
              <th
                key={p.id}
                className="bg-navy-deep px-1 py-1.5 text-center font-mono text-[10px] font-medium text-surface/80"
              >
                {p.label}
              </th>
            ))}
            <th className="bg-navy-deep" />
            {PERIODS.slice(4).map((p) => (
              <th
                key={p.id}
                className="bg-navy-deep px-1 py-1.5 text-center font-mono text-[10px] font-medium text-surface/80"
              >
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, d) => (
            <DayBlock
              key={day}
              day={day}
              d={d}
              occ={occ}
              codes={codes}
              last={d === DAYS.length - 1}
              onRemove={onRemove}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DayBlock({
  day,
  d,
  occ,
  codes,
  last,
  onRemove,
}: {
  day: string;
  d: number;
  occ: Map<number, Offering>;
  codes: string[];
  last: boolean;
  onRemove?: (code: string) => void;
}) {
  return (
    <>
      <tr>
        <th
          rowSpan={2}
          className={cn(
            "bg-surface-2 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-navy",
            last && "rounded-bl-lg",
          )}
        >
          {day}
        </th>
        {PERIODS.map((p, i) => {
          const slot = THEORY_GRID[d]![p.id]!;
          const idx = cellIndex(d, p.id);
          const o = occ.get(idx);
          const show = o && o.theorySlots.includes(slot);
          return (
            <GridCell key={`t-${p.id}`} lunchAfter={i === 3} lastCol={i === 7 && last} tone="theory">
              {show && o ? (
                <FilledCell offering={o} codes={codes} slot={slot} kind="T" onRemove={onRemove} />
              ) : (
                <EmptySlot label={slot} blocked={Boolean(o)} />
              )}
            </GridCell>
          );
        })}
      </tr>
      <tr>
        {LAB_BLOCK_PERIODS.map((pair, b) => {
          const label = LAB_BLOCKS[d]![b]!;
          const idx0 = cellIndex(d, pair[0]);
          const idx1 = cellIndex(d, pair[1]);
          const o = occ.get(idx0) ?? occ.get(idx1);
          const show = o && o.labSlots.includes(label);
          return (
            <GridCell
              key={`l-${b}`}
              span={2}
              lunchAfter={b === 1}
              lastCol={b === 3 && last}
              tone="lab"
            >
              {show && o ? (
                <FilledCell offering={o} codes={codes} slot={label} kind="P" onRemove={onRemove} />
              ) : (
                <EmptySlot label={label} blocked={Boolean(o)} muted />
              )}
            </GridCell>
          );
        })}
      </tr>
    </>
  );
}

function GridCell({
  children,
  span = 1,
  lunchAfter,
  lastCol,
  tone,
}: {
  children: ReactNode;
  span?: number;
  lunchAfter?: boolean;
  lastCol?: boolean;
  tone: "theory" | "lab";
}) {
  return (
    <>
      <td
        colSpan={span}
        className={cn(
          "border-t border-line p-0.5 align-top",
          tone === "theory" ? "bg-theory/35" : "bg-lab/40",
          lastCol && "rounded-br-lg",
        )}
      >
        {children}
      </td>
      {lunchAfter ? (
        <td className="border-t border-line bg-surface-2 text-center font-mono text-[9px] uppercase tracking-widest text-faint" />
      ) : null}
    </>
  );
}

function EmptySlot({ label, blocked, muted }: { label: string; blocked?: boolean; muted?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-h-11 items-center justify-center rounded-sm px-1 text-center font-mono text-[10px] tracking-wide",
        muted ? "text-faint/80" : "text-faint",
        blocked && "gap-hatch text-faint/50",
      )}
    >
      {label}
    </div>
  );
}

function FilledCell({
  offering,
  codes,
  slot,
  kind,
  onRemove,
}: {
  offering: Offering;
  codes: string[];
  slot: string;
  kind: "T" | "P";
  onRemove?: (code: string) => void;
}) {
  const faculty =
    kind === "P"
      ? offering.labFaculty || offering.theoryFaculty
      : offering.theoryFaculty || offering.labFaculty;
  return (
    <button
      type="button"
      onClick={() => onRemove?.(offering.code)}
      title={`${offering.code} · ${offering.name}\n${slot} · ${faculty || "Faculty TBA"}\nClick to remove`}
      className={cn(
        "flex min-h-14 w-full flex-col items-center justify-center rounded-sm px-1.5 py-1.5 text-center text-ink",
        colorForCode(offering.code, codes),
      )}
    >
      <span className="font-mono text-[10px] font-medium tracking-wide text-navy">{slot}</span>
      <span className="text-[11px] font-semibold leading-tight">{offering.code}</span>
      <span className="max-w-full truncate text-[10px] leading-tight text-ink-soft">{faculty}</span>
    </button>
  );
}
