"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { UserButton } from "@clerk/nextjs";
import type { Owner, Period, Task, Status, Week, Role } from "@/lib/types";
import { STATUSES, WEEKS, STATUS_CLASS, WEEK_ORDER } from "@/lib/types";
import { counts, pct } from "@/lib/compute";
import { api } from "@/lib/api";
import CalendarView from "@/components/CalendarView";
import GuideView from "@/components/GuideView";
import DeptGuide from "@/components/DeptGuide";

type View = "tracker" | "calendar" | "guide" | "dept";
type Group = "week" | "cat" | "owner" | "type";

interface Props {
  owners: Owner[];
  initialPeriods: Period[];
  initialPeriodId: string | null;
  initialTasks: Task[];
  authEnabled?: boolean;
  canEdit?: boolean;
  userName?: string | null;
  role?: Role;
}

export default function TrackerApp({
  owners,
  initialPeriods,
  initialPeriodId,
  initialTasks,
  authEnabled = false,
  canEdit = true,
  userName = null,
  role = "admin",
}: Props) {
  const [periods, setPeriods] = useState<Period[]>(initialPeriods);
  const [periodId, setPeriodId] = useState<string | null>(initialPeriodId);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [view, setView] = useState<View>("tracker");
  const [group, setGroup] = useState<Group>("week");
  const [fOwner, setFOwner] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fWeek, setFWeek] = useState("all");
  const [q, setQ] = useState("");
  const [showNA, setShowNA] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"info" | "success" | "error">("info");
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);

  const ownerName = useCallback(
    (id: string | null) => owners.find((o) => o.id === id)?.name ?? "(unassigned)",
    [owners]
  );
  const period = periods.find((p) => p.id === periodId) ?? null;

  const flash = useCallback((msg: string, type: "info" | "success" | "error" = "info") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), type === "success" ? 3000 : 1800);
  }, []);

  // ---------- task mutations (optimistic) ----------
  const patchTask = useCallback(
    async (id: string, patch: Partial<Task>) => {
      if (!canEdit) { flash("You have view-only access"); return; }
      const prev = tasks;
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      try {
        await api.updateTask(id, patch);
      } catch (e) {
        setTasks(prev);
        flash((e as Error).message);
      }
    },
    [tasks, flash, canEdit]
  );

  const removeTask = useCallback(
    async (id: string) => {
      if (!canEdit) { flash("You have view-only access"); return; }
      const t = tasks.find((x) => x.id === id);
      if (!t || !confirm(`Delete task: "${t.name}"?`)) return;
      const prev = tasks;
      setTasks((ts) => ts.filter((x) => x.id !== id));
      try {
        await api.deleteTask(id);
        flash("Task deleted");
      } catch (e) {
        setTasks(prev);
        flash((e as Error).message);
      }
    },
    [tasks, flash, canEdit]
  );

  // ---------- period switching ----------
  async function switchPeriod(id: string) {
    setPeriodId(id);
    setBusy(true);
    try {
      setTasks(await api.listTasks(id));
    } catch (e) {
      flash((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function newPeriod() {
    const label = prompt('Name the new close period (e.g. "July 2026"):');
    if (!label || !label.trim()) return;
    setBusy(true);
    try {
      const p = await api.createPeriod(label.trim());
      setPeriods((ps) => [p, ...ps]);
      setPeriodId(p.id);
      setTasks(await api.listTasks(p.id));
      flash("New period created");
    } catch (e) {
      flash((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function renamePeriod() {
    if (!period) return;
    const v = prompt("Rename period:", period.label);
    if (!v || !v.trim()) return;
    try {
      await api.renamePeriod(period.id, v.trim());
      setPeriods((ps) => ps.map((p) => (p.id === period.id ? { ...p, label: v.trim() } : p)));
    } catch (e) {
      flash((e as Error).message);
    }
  }

  async function deletePeriod() {
    if (!period) return;
    if (!confirm(`Delete period "${period.label}" and all its tasks?`)) return;
    setBusy(true);
    try {
      await api.deletePeriod(period.id);
      const remaining = periods.filter((p) => p.id !== period.id);
      setPeriods(remaining);
      const next = remaining[0]?.id ?? null;
      setPeriodId(next);
      setTasks(next ? await api.listTasks(next) : []);
      flash("Period deleted");
    } catch (e) {
      flash((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function resetPeriod() {
    if (!period) return;
    if (!confirm("Reset this period's tasks back to the template? Current statuses and notes will be cleared.")) return;
    setBusy(true);
    try {
      await api.resetPeriod(period.id);
      setTasks(await api.listTasks(period.id));
      flash("Period reset to template");
    } catch (e) {
      flash((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // ---------- add task ----------
  const [aName, setAName] = useState("");
  const [aCat, setACat] = useState("General");
  const [aWeek, setAWeek] = useState<Week>("One");
  const [aOwner, setAOwner] = useState("");
  const [aType, setAType] = useState<"Close" | "Close Adjacent">("Close");
  const [aDue, setADue] = useState("");

  async function addTask() {
    if (!periodId) return;
    if (!canEdit) { flash("You have view-only access"); return; }
    if (!aName.trim()) {
      flash("Enter a task name");
      return;
    }
    try {
      const t = await api.createTask({
        period_id: periodId,
        name: aName.trim(),
        type: aType,
        category: aCat,
        week: aWeek,
        owner_id: aOwner || null,
        due_date: aDue || null,
      });
      setTasks((ts) => [...ts, t]);
      setAName("");
      setADue("");
      flash("Task added");
    } catch (e) {
      flash((e as Error).message);
    }
  }

  // ---------- derived ----------
  const categories = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.category))).sort(),
    [tasks]
  );

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return tasks.filter((t) => {
      if (!showNA && t.status === "N/A") return false;
      if (fOwner !== "all") {
        const o = t.owner_id ? ownerName(t.owner_id) : "(unassigned)";
        if (o !== fOwner) return false;
      }
      if (fStatus !== "all" && t.status !== fStatus) return false;
      if (fWeek !== "all" && t.week !== fWeek) return false;
      if (ql) {
        const blob = `${t.name} ${t.notes} ${ownerName(t.owner_id)} ${t.category} ${t.type}`.toLowerCase();
        if (!blob.includes(ql)) return false;
      }
      return true;
    });
  }, [tasks, showNA, fOwner, fStatus, fWeek, q, ownerName]);

  const groupKey = useCallback(
    (t: Task) => {
      if (group === "week") return "Week " + t.week;
      if (group === "cat") return t.category;
      if (group === "owner") return t.owner_id ? ownerName(t.owner_id) : "(unassigned)";
      return t.type;
    },
    [group, ownerName]
  );

  const groups = useMemo(() => {
    const g: Record<string, Task[]> = {};
    filtered.forEach((t) => {
      const k = groupKey(t);
      (g[k] = g[k] || []).push(t);
    });
    const keys = Object.keys(g).sort((a, b) => {
      if (group === "week")
        return (WEEK_ORDER[a.replace("Week ", "") as Week] || 9) - (WEEK_ORDER[b.replace("Week ", "") as Week] || 9);
      return a.localeCompare(b);
    });
    return { g, keys };
  }, [filtered, groupKey, group]);

  const overall = pct(tasks);
  const c = counts(tasks);
  const segDenom = overall.denom || 1;

  function exportCsv() {
    const head = ["Type", "Category", "Task", "Week", "Owner", "Status", "Frequency", "Due", "Notes"];
    const rows = tasks.map((t) => [
      t.type, t.category, t.name, t.week, ownerName(t.owner_id), t.status,
      t.frequency ?? "", t.due_date ?? "", t.notes,
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${period?.label ?? "close"}.csv`;
    a.click();
  }

  const csvRef = useRef<HTMLInputElement>(null);

  function parseCsvLine(line: string): string[] {
    const vals: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQuotes = false;
        else cur += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ",") { vals.push(cur.trim()); cur = ""; }
        else cur += ch;
      }
    }
    vals.push(cur.trim());
    return vals;
  }

  async function importCsv(file: File) {
    if (!periodId || !canEdit) return;
    setBusy(true);
    setImporting(true);
    flash("Importing tasks...", "info");
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) { flash("CSV has no data rows", "error"); return; }

      const hdr = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z_]/g, ""));
      const nameIdx = hdr.findIndex((h) => h === "name" || h === "task");
      if (nameIdx === -1) { flash("CSV must have a 'name' or 'task' column", "error"); return; }

      const col = (h: string) => { const i = hdr.indexOf(h); return i >= 0 ? i : -1; };
      const get = (v: string[], ...keys: string[]) => {
        for (const k of keys) { const i = col(k); if (i >= 0 && v[i]) return v[i]; }
        return "";
      };
      const ownerMap = new Map(owners.map((o) => [o.name.toLowerCase(), o.id]));
      const weekMap: Record<string, Week> = { one: "One", two: "Two", three: "Three", "1": "One", "2": "Two", "3": "Three", wk1: "One", wk2: "Two", wk3: "Three" };
      const typeMap: Record<string, string> = { close: "Close", review: "Close", "close adjacent": "Close Adjacent", adjacent: "Close Adjacent" };

      const parsed: Record<string, unknown>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const v = parseCsvLine(lines[i]);
        const name = v[nameIdx];
        if (!name) continue;

        const ownerRaw = get(v, "owner", "owner_name");
        const weekRaw = (get(v, "week") || "One").toLowerCase();
        const typeRaw = (get(v, "type") || "Close").toLowerCase();

        parsed.push({
          name,
          type: typeMap[typeRaw] ?? "Close",
          category: get(v, "category") || "General",
          week: weekMap[weekRaw] ?? "One",
          owner_id: ownerMap.get(ownerRaw.toLowerCase()) ?? null,
          status: get(v, "status") || "Not Started",
          frequency: get(v, "frequency") || null,
          due_date: get(v, "due_date", "due") || null,
          notes: get(v, "notes") || "",
        });
      }

      if (!parsed.length) { flash("No valid rows found in CSV", "error"); return; }

      const result = await api.importTasks(periodId, parsed);
      setTasks((ts) => [...ts, ...result.tasks]);
      flash(`Successfully imported ${result.count} tasks`, "success");
    } catch (e) {
      flash(`Import failed: ${(e as Error).message}`, "error");
    } finally {
      setBusy(false);
      setImporting(false);
      if (csvRef.current) csvRef.current.value = "";
    }
  }

  return (
    <div className="wrap">
      {/* Masthead */}
      <div className="mast">
        <div className="brand">
          <div className="eyebrow">MACRO Media, LLC &amp; Subsidiaries</div>
          <h1>
            Accounting &amp; <em>Finance</em>
          </h1>
          <div className="sub">Monthly close tracker &amp; department reference · sample data</div>
        </div>
        <div className="period">
          {view === "tracker" && (
            <>
              <select value={periodId ?? ""} onChange={(e) => switchPeriod(e.target.value)} title="Active close period">
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <button className="btn sm" onClick={newPeriod} disabled={busy || !canEdit}>+ New</button>
              <button className="btn ghost sm" onClick={renamePeriod} disabled={!period || !canEdit}>Rename</button>
              <button className="btn ghost sm" onClick={deletePeriod} disabled={!period || !canEdit}>Delete</button>
            </>
          )}
          {!canEdit && (
            <span className="chip is-na" title="Your account has view-only access">
              <span className="dot" />View only
            </span>
          )}
          {authEnabled && (
            <>
              {userName && (
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {userName}<span style={{ opacity: 0.6 }}> · {role}</span>
                </span>
              )}
              <UserButton />
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <nav className="tabs">
        <button className={`tab ${view === "tracker" ? "on" : ""}`} onClick={() => setView("tracker")}>Close Tracker</button>
        <button className={`tab ${view === "calendar" ? "on" : ""}`} onClick={() => setView("calendar")}>Calendar</button>
        <button className={`tab ${view === "guide" ? "on" : ""}`} onClick={() => setView("guide")}>How to Manage the Close</button>
        <button className={`tab ${view === "dept" ? "on" : ""}`} onClick={() => setView("dept")}>Department Guide</button>
      </nav>

      {/* Tracker */}
      {view === "tracker" && (
        <>
          <div className="overview">
            <div className="panel">
              <div className="ph">
                <span className="lbl">Completion</span>
                <span className="lbl">{overall.done} / {overall.denom} tasks</span>
              </div>
              <div className="bigpct">
                <div className="n"><span>{overall.pct}</span><small>%</small></div>
                <div className="ctx">{tasks.length - overall.denom} marked N/A · {overall.denom - overall.done} remaining</div>
              </div>
              <div className="segbar">
                <span className="seg-done" style={{ width: `${(c["Completed"] / segDenom) * 100}%` }} />
                <span className="seg-ir" style={{ width: `${(c["In Review"] / segDenom) * 100}%` }} />
                <span className="seg-ip" style={{ width: `${(c["In Progress"] / segDenom) * 100}%` }} />
                <span className="seg-ns" style={{ width: `${(Math.max(0, c["Not Started"]) / segDenom) * 100}%` }} />
              </div>
              <div className="legend">
                {STATUSES.map((s) => (
                  <span key={s} className={`chip is-${STATUS_CLASS[s]}`}>
                    <span className="dot" />{s} <span className="ct">{c[s]}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="panel">
              <div className="ph"><span className="lbl">Progress by close week</span><span className="lbl">WK1 · WK2 · WK3</span></div>
              <div className="weekgrid">
                {(["One", "Two", "Three"] as Week[]).map((w) => {
                  const wl = tasks.filter((t) => t.week === w);
                  const wp = pct(wl);
                  return (
                    <div className="wk" key={w}>
                      <div className="wn">Week {w}</div>
                      <div className="wp">{wp.pct}<small>%</small></div>
                      <div className="wbar"><i style={{ width: `${wp.pct}%` }} /></div>
                      <div className="tmeta" style={{ marginTop: 6 }}>{wp.done}/{wp.denom} done · {wl.length} total</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="controls">
            <div className="grow">
              <input type="text" placeholder="Search tasks, notes, owners…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="seg">
              {(["week", "cat", "owner", "type"] as Group[]).map((g) => (
                <button key={g} className={group === g ? "on" : ""} onClick={() => setGroup(g)}>
                  {g === "cat" ? "Category" : g === "owner" ? "Owner" : g === "type" ? "Type" : "Week"}
                </button>
              ))}
            </div>
            <select value={fOwner} onChange={(e) => setFOwner(e.target.value)}>
              <option value="all">All owners</option>
              <option value="(unassigned)">(unassigned)</option>
              {owners.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
            </select>
            <select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={fWeek} onChange={(e) => setFWeek(e.target.value)}>
              <option value="all">All weeks</option>
              {(["One", "Two", "Three"] as Week[]).map((w) => <option key={w} value={w}>Week {w}</option>)}
            </select>
            <div className="toolbar-r">
              <button className="btn ghost sm" onClick={() => setShowNA((v) => !v)}>{showNA ? "Hide N/A" : "Show N/A"}</button>
              {canEdit && (
                <>
                  <input ref={csvRef} type="file" accept=".csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); }} />
                  <button className="btn sm" onClick={() => csvRef.current?.click()} disabled={busy || !periodId}>
                    {importing ? "Importing..." : "Import CSV"}
                  </button>
                </>
              )}
              <button className="btn sm" onClick={exportCsv}>Export CSV</button>
            </div>
          </div>

          {/* Board */}
          <div>
            {groups.keys.length === 0 ? (
              <div className="panel empty">No tasks match the current filters.</div>
            ) : (
              groups.keys.map((k) => {
                const items = groups.g[k].slice().sort((a, b) => (WEEK_ORDER[a.week] || 9) - (WEEK_ORDER[b.week] || 9));
                const gp = pct(groups.g[k]);
                const isCol = !!collapsed[k];
                return (
                  <div className={`group ${isCol ? "collapsed" : ""}`} key={k}>
                    <div className="ghd" onClick={() => setCollapsed((m) => ({ ...m, [k]: !m[k] }))}>
                      <span className="caret">▼</span>
                      <span className="gt">{k}<span className="tag">{groups.g[k].length} task{groups.g[k].length > 1 ? "s" : ""}</span></span>
                      <span className="gpct"><span className="gbar"><i style={{ width: `${gp.pct}%` }} /></span>{gp.pct}% · {gp.done}/{gp.denom}</span>
                    </div>
                    <div className="rows">
                      {items.map((t) => (
                        <TaskRow
                          key={t.id}
                          task={t}
                          owners={owners}
                          categories={categories}
                          canEdit={canEdit}
                          onPatch={patchTask}
                          onDelete={removeTask}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add task */}
          {canEdit && (
          <div className="addbar">
            <strong style={{ fontSize: 12, color: "var(--ink-soft)", letterSpacing: ".04em" }}>ADD TASK</strong>
            <input type="text" placeholder="Task name" value={aName} onChange={(e) => setAName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} />
            <select value={aCat} onChange={(e) => setACat(e.target.value)}>
              {(categories.length ? categories : ["General"]).map((cc) => <option key={cc}>{cc}</option>)}
            </select>
            <select value={aWeek} onChange={(e) => setAWeek(e.target.value as Week)}><option>One</option><option>Two</option><option>Three</option></select>
            <select value={aOwner} onChange={(e) => setAOwner(e.target.value)}>
              <option value="">(unassigned)</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <select value={aType} onChange={(e) => setAType(e.target.value as "Close" | "Close Adjacent")}><option>Close</option><option>Close Adjacent</option></select>
            <input type="date" value={aDue} onChange={(e) => setADue(e.target.value)} title="Due date" />
            <button className="btn primary sm" onClick={addTask}>Add</button>
          </div>
          )}

          <div className="foot">
            <div>Changes save to the shared database automatically. Running on <strong>sample data</strong>.</div>
            {canEdit && <div><button className="btn ghost sm" onClick={resetPeriod} disabled={!period}>Reset to template</button></div>}
          </div>
        </>
      )}

      {view === "calendar" && period && (
        <CalendarView
          tasks={tasks}
          owners={owners}
          closeStart={period.close_start}
          onPatch={patchTask}
          onSetStart={async (d) => {
            try {
              await api.setPeriodStart(period.id, d || null);
              setPeriods((ps) => ps.map((p) => (p.id === period.id ? { ...p, close_start: d || null } : p)));
            } catch (e) { flash((e as Error).message); }
          }}
        />
      )}

      {view === "guide" && <GuideView />}
      {view === "dept" && <DeptGuide />}

      <div className={`toast ${toast ? "show" : ""}`} style={toastType === "success" ? { background: "#2a7a4b" } : toastType === "error" ? { background: "#c0392b" } : undefined}>{toast}</div>
    </div>
  );
}

// ---------- Row ----------
function TaskRow({
  task, owners, categories, canEdit, onPatch, onDelete,
}: {
  task: Task;
  owners: Owner[];
  categories: string[];
  canEdit: boolean;
  onPatch: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}) {
  const sc = STATUS_CLASS[task.status];
  const tyClass = task.type === "Close Adjacent" ? "adj" : "close";
  const tyLabel = task.type === "Close Adjacent" ? "ADJACENT" : "CLOSE";
  const [note, setNote] = useState(task.notes);

  return (
    <div className={`row s-${sc}`}>
      <div className="c-stat">
        <select className={`stat v-${sc}`} value={task.status} disabled={!canEdit} onChange={(e) => onPatch(task.id, { status: e.target.value as Status })}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="c-task">
        <div
          className="tname"
          title={canEdit ? "Double-click to rename" : undefined}
          onDoubleClick={() => {
            if (!canEdit) return;
            const v = prompt("Rename task:", task.name);
            if (v && v.trim()) onPatch(task.id, { name: v.trim() });
          }}
        >
          {task.name}
        </div>
        <div className="tmeta">
          <span className={`ty ${tyClass}`}>{tyLabel}</span>
          <span className="cat">{task.category}</span>
          {task.frequency && <span className="freq">{task.frequency}</span>}
          <input
            type="date"
            className="duein"
            value={task.due_date ?? ""}
            disabled={!canEdit}
            onChange={(e) => onPatch(task.id, { due_date: e.target.value || null })}
            title="Due date"
          />
          <input
            className="note"
            value={note}
            placeholder={canEdit ? "add note…" : ""}
            readOnly={!canEdit}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => { if (canEdit && note !== task.notes) onPatch(task.id, { notes: note }); }}
          />
        </div>
      </div>
      <div className="c-owner">
        <select className="owner" value={task.owner_id ?? ""} disabled={!canEdit} onChange={(e) => onPatch(task.id, { owner_id: e.target.value || null })}>
          <option value="">(unassigned)</option>
          {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div className="c-cat">
        <select className="owner" value={task.category} disabled={!canEdit} onChange={(e) => onPatch(task.id, { category: e.target.value })}>
          {categories.map((cc) => <option key={cc} value={cc}>{cc}</option>)}
        </select>
      </div>
      <div className="c-week">
        <select className="wk-sel" value={task.week} disabled={!canEdit} onChange={(e) => onPatch(task.id, { week: e.target.value as Week })}>
          {(["One", "Two", "Three"] as Week[]).map((w) => <option key={w} value={w}>WK{WEEK_ORDER[w]}</option>)}
        </select>
      </div>
      <div className="c-del">
        {canEdit && <button className="delx" onClick={() => onDelete(task.id)} title="Delete task">×</button>}
      </div>
    </div>
  );
}
