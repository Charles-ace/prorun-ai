import { NextResponse } from "next/server";
import type { Portfolio } from "@/lib/types";
import { generateRiskReport } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const portfolio = body?.portfolio as Portfolio | undefined;
    if (!portfolio?.assets?.length) {
      return NextResponse.json({ error: "portfolio required" }, { status: 400 });
    }
    const report = await generateRiskReport(portfolio);
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: "analysis failed" }, { status: 500 });
  }
}