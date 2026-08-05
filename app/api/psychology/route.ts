import { NextResponse } from "next/server";
import type { Trade } from "@/lib/types";
import { generatePsychologyReport } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const trades = body?.trades as Trade[] | undefined;
    if (!Array.isArray(trades) || trades.length === 0) {
      return NextResponse.json({ error: "trades required" }, { status: 400 });
    }
    const report = await generatePsychologyReport(trades);
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: "analysis failed" }, { status: 500 });
  }
}