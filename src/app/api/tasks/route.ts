import { NextRequest, NextResponse } from "next/server";
import { getTasks, createTask } from "@/lib/data";

export async function GET(req: NextRequest) {
  try {
    const periodId = req.nextUrl.searchParams.get("period");
    if (!periodId) {
      return NextResponse.json({ error: "period is required" }, { status: 400 });
    }
    return NextResponse.json(await getTasks(periodId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.period_id || !body.name?.trim()) {
      return NextResponse.json(
        { error: "period_id and name are required" },
        { status: 400 }
      );
    }
    const task = await createTask({ ...body, name: body.name.trim() });
    return NextResponse.json(task, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
