"use client";

import { useState } from "react";
import type { Owner, Task, Week } from "@/lib/types";
import { STATUS_CLASS } from "@/lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function addDays(iso: string, n: number): Date {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d;
}
function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function CalendarView({
  tasks, owners, closeStart, onPatch, onSetStart,
}: {
  tasks: Task[];
  owners: Owner[];
  closeStart: string | null;
  onPatch: (id: string, patch: Partial<Task>) => void;
  onSetStart: (d: string) => void;
}) {
  const [start, setStart] = useState(closeStart ?? "");
  const [calOwner, setCalOwner] = useState("all");
  const [hideDone, setHideDone] = useState(false);

  const ownerName = (id: string | null) => owners.find((o) => o.id === id)?.name ?? "";

  const visible = tasks.filter((t) => {
    if (hideDone && (t.status === "Completed" || t.status === "N/A")) return false;
    if (calOwner !== "all" && t.owner_id !== calOwner) return false;
    return true;
  });

  const weeks: Week[] = ["One", "Two", "Three"];

  // Map each week to its Mon-Fri date strings (if start is set)
  function weekDates(wi: number): string[] {
    if (!start) return [];
    return DAYS.map((_, di) => toISO(addDays(start, wi * 7 + di)));
  }

  function tasksForCell(week: Week, dateISO: string | null): Task[] {
    if (dateISO) return visible.filter((t) => t.due_date === dateISO);
    // "No date set" column: tasks of this week with no due date
    return visible.filter((t) => t.week === week && !t.due_date);
  }

  return (
    <div>
      <div className="cal-controls">
        <label style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          Week 1 Monday
          <input type="date" className="duein" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <button className="btn primary sm" onClick={() => onSetStart(start)}>Apply schedule</button>
        <select value={calOwner} onChange={(e) => setCalOwner(e.target.value)}>
          <option value="all">All owners</option>
          {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <button className="btn ghost sm" onClick={() => setHideDone((v) => !v)}>{hideDone ? "Show done/N/A" : "Hide done/N/A"}</button>
        <div className="cal-legend">
          <span><i style={{ background: "var(--ns)" }} />Not started</span>
          <span><i style={{ background: "var(--ip)" }} />In progress</span>
          <span><i style={{ background: "var(--ir)" }} />In review</span>
          <span><i style={{ background: "var(--done)" }} />Completed</span>
        </div>
      </div>

      {weeks.map((w, wi) => {
        const dates = weekDates(wi);
        const cols: { label: string; date: string | null }[] = [
          ...DAYS.map((d, di) => ({ label: d, date: dates[di] ?? null })),
          { label: "No date set", date: null },
        ];
        const wkTasks = visible.filter((t) => t.week === w);
        const done = wkTasks.filter((t) => t.status === "Completed").length;
        const denom = wkTasks.filter((t) => t.status !== "N/A").length;
        const wpct = denom ? Math.round((done / denom) * 100) : 0;

        return (
          <div className="calweek" key={w}>
            <div className="cwh">
              <span className="cwt">Week {w}<span className="tag">{wkTasks.length} tasks</span></span>
              <span className="cwbar"><i style={{ width: `${wpct}%` }} /></span>
            </div>
            <div className="calgrid">
              {cols.map((col, ci) => {
                const cellTasks = tasksForCell(w, col.date);
                return (
                  <div className="calcol" key={ci}>
                    <div className="dh">
                      <span>{col.label}</span>
                      {col.date && <span className="dc">{col.date.slice(8, 10)}/{col.date.slice(5, 7)}</span>}
                    </div>
                    {cellTasks.map((t) => (
                      <div className={`calcard s-${STATUS_CLASS[t.status]}`} key={t.id} title={t.name}>
                        <div className="ct">{t.name}</div>
                        <div className="cm">
                          {t.owner_id && <span className="own">{ownerName(t.owner_id)}</span>}
                          <input
                            type="date"
                            className="duein"
                            style={{ fontSize: 9.5, padding: "1px 3px" }}
                            value={t.due_date ?? ""}
                            onChange={(e) => onPatch(t.id, { due_date: e.target.value || null })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="foot">
        <div>Tasks appear on their due date. Set <strong>Week 1 Monday</strong> and click Apply to lay out the weeks; tasks without a date sit in the &ldquo;No date set&rdquo; column of their close week. Edit any card&rsquo;s date directly.</div>
      </div>
    </div>
  );
}
