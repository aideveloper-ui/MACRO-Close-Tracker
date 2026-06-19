import type { Status, Task } from "./types";
import { STATUSES } from "./types";

export function counts(list: Task[]): Record<Status, number> {
  const c: Record<Status, number> = {
    "Not Started": 0,
    "In Progress": 0,
    "In Review": 0,
    Completed: 0,
    "N/A": 0,
  };
  list.forEach((t) => {
    c[t.status] = (c[t.status] ?? 0) + 1;
  });
  return c;
}

export function pct(list: Task[]): { denom: number; done: number; pct: number } {
  const denom = list.filter((t) => t.status !== "N/A").length;
  const done = list.filter((t) => t.status === "Completed").length;
  return { denom, done, pct: denom ? Math.round((done / denom) * 100) : 0 };
}

export const ALL_STATUSES = STATUSES;
