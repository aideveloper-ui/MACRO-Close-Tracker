// Shared domain types for the MACRO close tracker.

export const STATUSES = [
  "Not Started",
  "In Progress",
  "In Review",
  "Completed",
  "N/A",
] as const;
export type Status = (typeof STATUSES)[number];

export const WEEKS = ["One", "Two", "Three"] as const;
export type Week = (typeof WEEKS)[number];

export const TYPES = ["Close", "Close Adjacent"] as const;
export type TaskType = (typeof TYPES)[number];

export const FREQUENCIES = ["Monthly", "Quarterly", "Annual", "As Needed"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const ROLES = ["admin", "editor", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const STATUS_CLASS: Record<Status, string> = {
  "Not Started": "ns",
  "In Progress": "ip",
  "In Review": "ir",
  Completed: "done",
  "N/A": "na",
};

export const WEEK_ORDER: Record<Week, number> = { One: 1, Two: 2, Three: 3 };

export interface Owner {
  id: string;
  name: string;
  email: string | null;
  role: Role;
  is_offshore: boolean;
  active: boolean;
  sort_order: number;
}

export interface Period {
  id: string;
  label: string;
  close_start: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  period_id: string;
  type: TaskType;
  category: string;
  name: string;
  week: Week;
  owner_id: string | null;
  status: Status;
  frequency: Frequency | null;
  notes: string;
  due_date: string | null;
  sort_order: number;
}
