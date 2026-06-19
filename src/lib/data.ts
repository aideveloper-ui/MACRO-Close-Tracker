import { supabase } from "./supabase";
import type { Owner, Period, Task } from "./types";

// ---------- Owners ----------
export async function getOwners(): Promise<Owner[]> {
  const { data, error } = await supabase
    .from("owners")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ---------- Periods ----------
export async function getPeriods(): Promise<Period[]> {
  const { data, error } = await supabase
    .from("periods")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPeriod(label: string): Promise<Period> {
  // Create the period, then seed its tasks from the template
  // (N/A defaults are preserved; everything else starts Not Started).
  const { data: period, error } = await supabase
    .from("periods")
    .insert({ label })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const { data: templates, error: tErr } = await supabase
    .from("task_templates")
    .select("*")
    .order("sort_order", { ascending: true });
  if (tErr) throw new Error(tErr.message);

  if (templates && templates.length) {
    const rows = templates.map((t) => ({
      period_id: period.id,
      type: t.type,
      category: t.category,
      name: t.name,
      week: t.week,
      owner_id: t.default_owner_id,
      status: t.default_status === "N/A" ? "N/A" : "Not Started",
      frequency: t.frequency,
      notes: "",
      sort_order: t.sort_order,
    }));
    const { error: insErr } = await supabase.from("tasks").insert(rows);
    if (insErr) throw new Error(insErr.message);
  }
  return period;
}

export async function renamePeriod(id: string, label: string): Promise<void> {
  const { error } = await supabase.from("periods").update({ label }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setPeriodStart(id: string, close_start: string | null): Promise<void> {
  const { error } = await supabase.from("periods").update({ close_start }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePeriod(id: string): Promise<void> {
  const { error } = await supabase.from("periods").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function resetPeriod(id: string): Promise<void> {
  // Wipe the period's tasks and re-seed from the template.
  const { error: delErr } = await supabase.from("tasks").delete().eq("period_id", id);
  if (delErr) throw new Error(delErr.message);

  const { data: templates, error: tErr } = await supabase
    .from("task_templates")
    .select("*")
    .order("sort_order", { ascending: true });
  if (tErr) throw new Error(tErr.message);

  if (templates && templates.length) {
    const rows = templates.map((t) => ({
      period_id: id,
      type: t.type,
      category: t.category,
      name: t.name,
      week: t.week,
      owner_id: t.default_owner_id,
      status: t.default_status === "N/A" ? "N/A" : "Not Started",
      frequency: t.frequency,
      notes: "",
      sort_order: t.sort_order,
    }));
    const { error: insErr } = await supabase.from("tasks").insert(rows);
    if (insErr) throw new Error(insErr.message);
  }
}

// ---------- Tasks ----------
export async function getTasks(periodId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("period_id", periodId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function bulkCreateTasks(rows: Array<Partial<Task> & { period_id: string; name: string }>): Promise<Task[]> {
  if (!rows.length) return [];
  const inserts = rows.map((r, i) => ({
    period_id: r.period_id,
    type: r.type ?? "Close",
    category: r.category ?? "General",
    name: r.name,
    week: r.week ?? "One",
    owner_id: r.owner_id ?? null,
    status: r.status ?? "Not Started",
    frequency: r.frequency ?? null,
    notes: r.notes ?? "",
    due_date: r.due_date ?? null,
    sort_order: r.sort_order ?? 900 + i,
  }));
  const { data, error } = await supabase.from("tasks").insert(inserts).select("*");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTask(input: Partial<Task> & { period_id: string; name: string }): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      period_id: input.period_id,
      type: input.type ?? "Close",
      category: input.category ?? "General",
      name: input.name,
      week: input.week ?? "One",
      owner_id: input.owner_id ?? null,
      status: input.status ?? "Not Started",
      frequency: input.frequency ?? null,
      notes: input.notes ?? "",
      due_date: input.due_date ?? null,
      sort_order: input.sort_order ?? 999,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

const EDITABLE_FIELDS = [
  "type",
  "category",
  "name",
  "week",
  "owner_id",
  "status",
  "frequency",
  "notes",
  "due_date",
] as const;

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  const clean: Record<string, unknown> = {};
  for (const f of EDITABLE_FIELDS) {
    if (f in patch) clean[f] = (patch as Record<string, unknown>)[f];
  }
  if (Object.keys(clean).length === 0) return;
  const { error } = await supabase.from("tasks").update(clean).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
