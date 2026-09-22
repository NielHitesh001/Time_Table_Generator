import { create } from "zustand";
import type { Offering } from "@/lib/catalog";
import {
  DEFAULT_OPTIONS,
  clashWith,
  defaultPlan,
  duplicateCode,
  measure,
  solve,
  type Plan,
  type SolverOptions,
} from "@/lib/solver";

type Store = {
  options: SolverOptions;
  plans: Plan[];
  activeIndex: number;
  selected: Offering[];
  dirty: boolean;
  setOption: <K extends keyof SolverOptions>(key: K, value: SolverOptions[K]) => void;
  generate: () => void;
  applyPlan: (index: number) => void;
  addOffering: (offering: Offering) => string | null;
  removeCode: (code: string) => void;
  swapOffering: (offering: Offering) => string | null;
  toggleLock: (code: string) => void;
  toggleBan: (code: string) => void;
  reset: () => void;
};

const initialPlans = defaultPlan();

export const usePlanner = create<Store>()((set, get) => ({
  options: DEFAULT_OPTIONS,
  plans: initialPlans,
  activeIndex: 0,
  selected: initialPlans[0]?.offerings ?? [],
  dirty: false,
  setOption: (key, value) => {
    set((s) => ({ options: { ...s.options, [key]: value } }));
  },
  generate: () => {
    const plans = solve(get().options);
    set({
      plans,
      activeIndex: 0,
      selected: plans[0]?.offerings ?? [],
      dirty: false,
    });
  },
  applyPlan: (index) => {
    const plan = get().plans[index];
    if (!plan) return;
    set({ activeIndex: index, selected: plan.offerings, dirty: false });
  },
  addOffering: (offering) => {
    const cur = get().selected;
    if (duplicateCode(cur, offering)) {
      return `Already registered ${offering.code}. Remove it first or swap the slot.`;
    }
    if (clashWith(cur, offering)) {
      return `${offering.code} clashes with a course already on the grid.`;
    }
    const next = [...cur, offering].sort(
      (a, b) => b.aimlScore - a.aimlScore || a.code.localeCompare(b.code),
    );
    const credits = next.reduce((s, o) => s + o.credits, 0);
    if (credits > 26) {
      return `That would be ${credits} credits — stay at or below 26.`;
    }
    set({ selected: next, dirty: true });
    return null;
  },
  removeCode: (code) => {
    set({ selected: get().selected.filter((o) => o.code !== code), dirty: true });
  },
  swapOffering: (offering) => {
    const without = get().selected.filter((o) => o.code !== offering.code);
    if (clashWith(without, offering)) {
      return `${offering.code} in this slot still clashes.`;
    }
    const next = [...without, offering].sort(
      (a, b) => b.aimlScore - a.aimlScore || a.code.localeCompare(b.code),
    );
    set({ selected: next, dirty: true });
    return null;
  },
  toggleLock: (code) => {
    const locked = get().options.lockedCodes;
    const next = locked.includes(code) ? locked.filter((c) => c !== code) : [...locked, code];
    const banned = get().options.bannedCodes.filter((c) => c !== code);
    set({ options: { ...get().options, lockedCodes: next, bannedCodes: banned } });
  },
  toggleBan: (code) => {
    const banned = get().options.bannedCodes;
    const next = banned.includes(code) ? banned.filter((c) => c !== code) : [...banned, code];
    const locked = get().options.lockedCodes.filter((c) => c !== code);
    set({
      options: { ...get().options, bannedCodes: next, lockedCodes: locked },
      selected: get().selected.filter((o) => o.code !== code),
      dirty: true,
    });
  },
  reset: () => {
    const plans = solve(DEFAULT_OPTIONS);
    set({
      options: DEFAULT_OPTIONS,
      plans,
      activeIndex: 0,
      selected: plans[0]?.offerings ?? [],
      dirty: false,
    });
  },
}));

export function selectedStats(selected: Offering[]) {
  return measure(selected);
}
