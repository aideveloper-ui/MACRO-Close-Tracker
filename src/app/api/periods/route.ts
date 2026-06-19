import { NextRequest, NextResponse } from "next/server";
import { getPeriods, createPeriod } from "@/lib/data";

export async function GET() {
  try {
    return NextResponse.json(await getPeriods());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { label } = await req.json();
    if (!label || !String(label).trim()) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }
    const period = await createPeriod(String(label).trim());
    return NextResponse.json(period, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
