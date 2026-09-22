export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export const PERIODS = [
  { id: 0, label: "9:00–9:50", session: "morning" },
  { id: 1, label: "9:55–10:45", session: "morning" },
  { id: 2, label: "10:50–11:40", session: "morning" },
  { id: 3, label: "11:45–12:35", session: "morning" },
  { id: 4, label: "1:15–2:05", session: "afternoon" },
  { id: 5, label: "2:10–3:00", session: "afternoon" },
  { id: 6, label: "3:05–3:55", session: "afternoon" },
  { id: 7, label: "4:00–4:50", session: "afternoon" },
] as const;

/** SCFAS / FFCS theory slot occupancy: [day][period] */
export const THEORY_GRID: readonly (readonly string[])[] = [
  ["A1", "F1", "D1", "TC1", "A2", "F2", "D2", "TC2"],
  ["B1", "G1", "E1", "TA1", "B2", "G2", "E2", "TA2"],
  ["C1", "A1", "F1", "B1", "C2", "A2", "F2", "B2"],
  ["D1", "B1", "G1", "C1", "D2", "B2", "G2", "C2"],
  ["E1", "C1", "A1", "TB1", "E2", "C2", "A2", "TB2"],
];

/** Lab pair occupying two consecutive periods, by day then block 0..3 */
export const LAB_BLOCKS: readonly (readonly string[])[] = [
  ["L1+L2", "L3+L4", "L21+L22", "L23+L24"],
  ["L5+L6", "L7+L8", "L25+L26", "L27+L28"],
  ["L9+L10", "L11+L12", "L29+L30", "L31+L32"],
  ["L13+L14", "L15+L16", "L33+L34", "L35+L36"],
  ["L17+L18", "L19+L20", "L37+L38", "L39+L40"],
];

export const LAB_BLOCK_PERIODS = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
] as const;

export function cellIndex(day: number, period: number) {
  return day * 8 + period;
}

export function unpackCell(index: number) {
  return { day: Math.floor(index / 8), period: index % 8 };
}

export function labBlockForPeriod(period: number) {
  return Math.floor(period / 2);
}

export function isMorning(period: number) {
  return period < 4;
}
