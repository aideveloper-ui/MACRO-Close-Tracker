// Thin client-side wrappers around our API routes.
import type { Period, Task } from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  // Periods
  listPeriods: () => fetch("/api/periods").then((r) => json<Period[]>(r)),
  createPeriod: (label: string) =>
    fetch("/api/periods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    }).then((r) => json<Period>(r)),
  renamePeriod: (id: string, label: string) =>
    fetch(`/api/periods/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    }).then((r) => json<{ ok: boolean }>(r)),
  setPeriodStart: (id: string, close_start: string | null) =>
    fetch(`/api/periods/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ close_start }),
    }).then((r) => json<{ ok: boolean }>(r)),
  deletePeriod: (id: string) =>
    fetch(`/api/periods/${id}`, { method: "DELETE" }).then((r) => json<{ ok: boolean }>(r)),
  resetPeriod: (id: string) =>
    fetch(`/api/periods/${id}/reset`, { method: "POST" }).then((r) => json<{ ok: boolean }>(r)),

  // Tasks
  listTasks: (periodId: string) =>
    fetch(`/api/tasks?period=${periodId}`).then((r) => json<Task[]>(r)),
  createTask: (input: Partial<Task> & { period_id: string; name: string }) =>
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((r) => json<Task>(r)),
  updateTask: (id: string, patch: Partial<Task>) =>
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then((r) => json<{ ok: boolean }>(r)),
  deleteTask: (id: string) =>
    fetch(`/api/tasks/${id}`, { method: "DELETE" }).then((r) => json<{ ok: boolean }>(r)),
  importTasks: (periodId: string, tasks: Record<string, unknown>[]) =>
    fetch("/api/tasks/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period_id: periodId, tasks }),
    }).then((r) => json<{ count: number; tasks: Task[] }>(r)),
};
