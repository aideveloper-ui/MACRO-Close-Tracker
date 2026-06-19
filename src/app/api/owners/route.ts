import { NextResponse } from "next/server";
import { getOwners } from "@/lib/data";

export async function GET() {
  try {
    const owners = await getOwners();
    return NextResponse.json(owners);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
