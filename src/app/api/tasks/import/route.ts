import { NextRequest, NextResponse } from "next/server";
import { bulkCreateTasks } from "@/lib/data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.period_id || !Array.isArray(body.tasks) || !body.tasks.length) {
      return NextResponse.json(
        { error: "period_id and a non-empty tasks array are required" },
        { status: 400 }
      );
    }
    const rows = body.tasks.map((t: Record<string, unknown>) => ({
      ...t,
      period_id: body.period_id,
      name: String(t.name ?? "").trim(),
    }));
    const invalid = rows.filter((r: { name: string }) => !r.name);
    if (invalid.length) {
      return NextResponse.json(
        { error: `${invalid.length} row(s) missing a task name` },
        { status: 400 }
      );
    }
    const created = await bulkCreateTasks(rows);
    return NextResponse.json({ count: created.length, tasks: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
