import raw from "@/data/catalog.json";

export type Offering = {
  id: string;
  code: string;
  name: string;
  category: string;
  basket: string | null;
  group: string;
  credits: number;
  lecture: number;
  practical: number;
  theoryFaculty: string;
  labFaculty: string;
  theorySlots: string[];
  labSlots: string[];
  cells: number[];
  venue: string;
  remarks: string;
  incomplete: boolean;
  project: boolean;
  aimlScore: number;
  section: string;
};

export type CompletedCourse = {
  code: string;
  name: string;
  term: string;
};

export const catalog = raw as {
  semester: string;
  academicYear: string;
  university: string;
  system: string;
  program: string;
  offerings: Offering[];
  completed: CompletedCourse[];
};

export const ALL_OFFERINGS: Offering[] = catalog.offerings;
export const COMPLETED_DEFAULT: CompletedCourse[] = catalog.completed;
export const COMPLETED_CODES = new Set(COMPLETED_DEFAULT.map((c) => c.code));

export function facultyOf(o: Offering) {
  return o.theoryFaculty || o.labFaculty || "Faculty TBA";
}

export function slotLabel(o: Offering) {
  const parts = [...o.theorySlots, ...o.labSlots];
  return parts.length ? parts.join(" · ") : o.project ? "Project — no slots" : "—";
}

export function lpc(o: Offering) {
  return `${o.lecture}–${o.practical}–${o.credits}`;
}

export function coursesByCode() {
  const map = new Map<string, Offering[]>();
  for (const o of ALL_OFFERINGS) {
    const list = map.get(o.code) ?? [];
    list.push(o);
    map.set(o.code, list);
  }
  return map;
}

export const COURSE_INDEX = coursesByCode();

export function uniqueCourses() {
  const seen = new Set<string>();
  const list: Offering[] = [];
  for (const o of ALL_OFFERINGS) {
    if (seen.has(o.code)) continue;
    seen.add(o.code);
    list.push(o);
  }
  return list.sort((a, b) => b.aimlScore - a.aimlScore || a.code.localeCompare(b.code));
}

export function overlaps(a: number[], b: number[]) {
  if (a.length === 0 || b.length === 0) return false;
  const set = new Set(a);
  for (const c of b) if (set.has(c)) return true;
  return false;
}

export function occupiedSet(offerings: Offering[]) {
  const set = new Set<number>();
  for (const o of offerings) for (const c of o.cells) set.add(c);
  return set;
}
