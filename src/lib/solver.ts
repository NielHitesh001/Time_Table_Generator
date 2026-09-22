import {
  ALL_OFFERINGS,
  COMPLETED_CODES,
  COURSE_INDEX,
  type Offering,
} from "@/lib/catalog";
import { isMorning } from "@/lib/slots";

export type SolverOptions = {
  creditMin: number;
  creditMax: number;
  excludeCompleted: boolean;
  excludePg: boolean;
  aimlFocus: boolean;
  includeSoftSkills: boolean;
  preferMorning: boolean;
  lockedCodes: string[];
  bannedCodes: string[];
};

export type Plan = {
  id: string;
  label: string;
  offerings: Offering[];
  credits: number;
  gaps: number;
  daysUsed: number;
  morningShare: number;
  aimlScore: number;
  compactness: number;
  clashes: number;
};

export const DEFAULT_OPTIONS: SolverOptions = {
  creditMin: 24,
  creditMax: 26,
  excludeCompleted: true,
  excludePg: true,
  aimlFocus: true,
  includeSoftSkills: true,
  preferMorning: false,
  lockedCodes: [],
  bannedCodes: [],
};

type CoursePick = {
  code: string;
  name: string;
  credits: number;
  score: number;
  group: string;
  offerings: Offering[];
};

function cellsOverlap(a: number[], b: number[]) {
  if (!a.length || !b.length) return false;
  const set = new Set(a);
  for (const x of b) if (set.has(x)) return true;
  return false;
}

export function measure(offerings: Offering[]) {
  const occ = new Array<boolean>(40).fill(false);
  let clashes = 0;
  for (const o of offerings) {
    for (const c of o.cells) {
      if (occ[c]) clashes += 1;
      occ[c] = true;
    }
  }
  let gaps = 0;
  let daysUsed = 0;
  let morning = 0;
  let total = 0;
  for (let d = 0; d < 5; d++) {
    const am: number[] = [];
    const pm: number[] = [];
    for (let p = 0; p < 8; p++) {
      if (!occ[d * 8 + p]) continue;
      total += 1;
      if (isMorning(p)) {
        morning += 1;
        am.push(p);
      } else pm.push(p);
    }
    if (am.length || pm.length) daysUsed += 1;
    const spanGaps = (xs: number[]) =>
      xs.length ? xs[xs.length - 1]! - xs[0]! + 1 - xs.length : 0;
    gaps += spanGaps(am) + spanGaps(pm);
  }
  const credits = offerings.reduce((s, o) => s + o.credits, 0);
  const aimlScore = offerings.reduce((s, o) => s + o.aimlScore * o.credits, 0);
  const morningShare = total ? morning / total : 0;
  const compactness = Math.max(0, Math.min(100, 100 - gaps * 9 - Math.max(0, daysUsed - 4) * 4));
  return { credits, gaps, daysUsed, morningShare, aimlScore, compactness, clashes };
}

function rankScore(planLike: ReturnType<typeof measure>, opts: SolverOptions) {
  let s = planLike.aimlScore - planLike.gaps * 48 - planLike.clashes * 500;
  if (opts.preferMorning) s += planLike.morningShare * 80;
  if (planLike.credits >= 25) s += 12;
  s += planLike.compactness * 0.6;
  return s;
}

function eligibleOfferings(opts: SolverOptions) {
  const banned = new Set(opts.bannedCodes);
  const completed = opts.excludeCompleted ? COMPLETED_CODES : new Set<string>();
  return ALL_OFFERINGS.filter((o) => {
    if (banned.has(o.code)) return false;
    if (completed.has(o.code)) return false;
    if (opts.excludePg && o.group === "pg") return false;
    if (!opts.includeSoftSkills && o.group === "soft") return false;
    return true;
  });
}

function coursePool(opts: SolverOptions): CoursePick[] {
  const byCode = new Map<string, Offering[]>();
  for (const o of eligibleOfferings(opts)) {
    const list = byCode.get(o.code) ?? [];
    list.push(o);
    byCode.set(o.code, list);
  }
  const picks: CoursePick[] = [];
  for (const [code, offerings] of byCode) {
    const head = offerings[0]!;
    let score = head.aimlScore;
    if (head.incomplete) score -= 18;
    if (!opts.aimlFocus) score = 40 + head.credits * 2;
    if (head.group === "soft") score = Math.min(score, 44);
    picks.push({
      code,
      name: head.name,
      credits: head.credits,
      score,
      group: head.group,
      offerings: offerings.slice().sort((a, b) => {
        const ai = a.incomplete ? 1 : 0;
        const bi = b.incomplete ? 1 : 0;
        return ai - bi || a.cells.length - b.cells.length;
      }),
    });
  }
  picks.sort((a, b) => b.score - a.score || a.code.localeCompare(b.code));
  return picks;
}

function assignOfferings(
  courses: CoursePick[],
  lockedIds: Map<string, Offering>,
): Offering[] | null {
  const ordered = courses.slice().sort((a, b) => a.offerings.length - b.offerings.length);
  const chosen: Offering[] = [];
  const used: number[] = [];

  const walk = (i: number): boolean => {
    if (i === ordered.length) return true;
    const course = ordered[i]!;
    const locked = lockedIds.get(course.code);
    const options = locked ? [locked] : course.offerings;
    for (const o of options) {
      if (cellsOverlap(used, o.cells)) continue;
      chosen.push(o);
      used.push(...o.cells);
      if (walk(i + 1)) return true;
      chosen.pop();
      used.length -= o.cells.length;
    }
    return false;
  };

  return walk(0) ? chosen.slice() : null;
}

function assignBest(
  courses: CoursePick[],
  lockedIds: Map<string, Offering>,
  opts: SolverOptions,
): Offering[] | null {
  const ordered = courses.slice().sort((a, b) => a.offerings.length - b.offerings.length);
  let best: Offering[] | null = null;
  let bestRank = -Infinity;
  let found = 0;
  const chosen: Offering[] = [];
  const used: number[] = [];

  const walk = (i: number) => {
    if (found >= 12) return;
    if (i === ordered.length) {
      const m = measure(chosen);
      const r = rankScore(m, opts);
      if (r > bestRank) {
        bestRank = r;
        best = chosen.slice();
      }
      found += 1;
      return;
    }
    const course = ordered[i]!;
    const options = lockedIds.get(course.code)
      ? [lockedIds.get(course.code)!]
      : course.offerings;
    for (const o of options) {
      if (cellsOverlap(used, o.cells)) continue;
      chosen.push(o);
      used.push(...o.cells);
      walk(i + 1);
      chosen.pop();
      used.length -= o.cells.length;
      if (found >= 12) return;
    }
  };

  walk(0);
  return best;
}

function comboKey(codes: string[]) {
  return codes.slice().sort().join("|");
}

function labelPlan(offerings: Offering[], index: number): string {
  const codes = new Set(offerings.map((o) => o.code));
  if (codes.has("CSE3010") && codes.has("CSE3011")) return "AIML basket complete";
  if (codes.has("CSE2008") && codes.has("CSE3003")) return "Core + cloud + crypto";
  if (codes.has("MAT1013") && codes.has("CSE2009")) return "Stats & analytics track";
  const names = ["Compact grid", "Alternate mix", "Credit-balanced", "Backup plan"];
  return names[index] ?? `Plan ${index + 1}`;
}

export function solve(opts: SolverOptions): Plan[] {
  const pool = coursePool(opts);
  const lockedCodes = opts.lockedCodes.filter((c) => pool.some((p) => p.code === c));
  const lockedSet = new Set(lockedCodes);
  const lockedIds = new Map<string, Offering>();

  const rest = pool.filter((p) => !lockedSet.has(p.code));
  const lockedPicks = pool.filter((p) => lockedSet.has(p.code));
  const lockedCredits = lockedPicks.reduce((s, p) => s + p.credits, 0);
  if (lockedCredits > opts.creditMax) return [];

  const primary = rest.filter((p) => p.score >= 70).slice(0, 11);
  const filler = rest.filter((p) => p.score < 70).slice(0, 10);
  const soft = rest.filter((p) => p.group === "soft");

  const plans: Plan[] = [];
  const seen = new Set<string>();

  const consider = (picks: CoursePick[]) => {
    const credits = picks.reduce((s, p) => s + p.credits, 0);
    if (credits > opts.creditMax) return;
    const key = comboKey(picks.map((p) => p.code));
    if (seen.has(key)) return;
    if (credits < opts.creditMin) return;
    const assigned = assignBest(picks, lockedIds, opts) ?? assignOfferings(picks, lockedIds);
    if (!assigned) return;
    seen.add(key);
    const m = measure(assigned);
    if (m.clashes > 0) return;
    if (m.credits < opts.creditMin || m.credits > opts.creditMax) return;
    plans.push({
      id: key,
      label: "",
      offerings: assigned.sort((a, b) => b.aimlScore - a.aimlScore || a.code.localeCompare(b.code)),
      ...m,
    });
  };

  const choose = (src: CoursePick[], k: number, start: number, acc: CoursePick[]) => {
    if (plans.length >= 24) return;
    const used = lockedCredits + acc.reduce((s, p) => s + p.credits, 0);
    if (used > opts.creditMax) return;
    if (acc.length === k) {
      consider([...lockedPicks, ...acc]);
      const base = [...lockedPicks, ...acc];
      const used = base.reduce((s, p) => s + p.credits, 0);
      const pads = [...soft, ...filler.filter((p) => p.group === "open" || p.credits === 1)];
      for (const s of pads) {
        if (base.some((p) => p.code === s.code)) continue;
        const next = used + s.credits;
        if (next >= opts.creditMin && next <= opts.creditMax) {
          consider([...base, s]);
        }
      }
      return;
    }
    const need = k - acc.length;
    for (let i = start; i <= src.length - need; i++) {
      acc.push(src[i]!);
      choose(src, k, i + 1, acc);
      acc.pop();
      if (plans.length >= 24) return;
    }
  };

  const searchSpace = primary.length ? primary : rest.slice(0, 12);
  for (let k = Math.min(8, searchSpace.length); k >= 4; k--) {
    choose(searchSpace, k, 0, []);
    if (plans.length >= 8) break;
  }

  if (plans.length < 3) {
    const broader = [...primary, ...filler].slice(0, 14);
    for (let k = 7; k >= 5; k--) {
      choose(broader, k, 0, []);
      if (plans.length >= 8) break;
    }
  }

  plans.sort((a, b) => rankScore(b, opts) - rankScore(a, opts) || b.credits - a.credits);

  const inBand = plans.filter((p) => p.credits >= opts.creditMin && p.credits <= opts.creditMax);
  const poolPlans = inBand.length ? inBand : plans;

  const diverse: Plan[] = [];
  for (const p of poolPlans) {
    const codes = new Set(p.offerings.map((o) => o.code));
    const tooClose = diverse.some((d) => {
      const other = new Set(d.offerings.map((o) => o.code));
      if (other.size !== codes.size) return false;
      for (const c of codes) if (!other.has(c)) return false;
      return true;
    });
    if (tooClose) continue;
    diverse.push({ ...p, label: labelPlan(p.offerings, diverse.length) });
    if (diverse.length >= 4) break;
  }

  if (diverse.length === 0 && plans[0]) {
    diverse.push({ ...plans[0], label: labelPlan(plans[0].offerings, 0) });
  }

  return diverse;
}

export function clashWith(current: Offering[], candidate: Offering) {
  return current.some((o) => o.id !== candidate.id && cellsOverlap(o.cells, candidate.cells));
}

export function duplicateCode(current: Offering[], candidate: Offering) {
  return current.some((o) => o.code === candidate.code && o.id !== candidate.id);
}

export function offeringById(id: string) {
  return ALL_OFFERINGS.find((o) => o.id === id);
}

export function defaultPlan(): Plan[] {
  return solve(DEFAULT_OPTIONS);
}

export function courseMeta(code: string) {
  return COURSE_INDEX.get(code)?.[0];
}
