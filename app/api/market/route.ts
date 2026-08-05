import { NextResponse } from "next/server";
import { generateMarketBrief } from "@/lib/ai";

export const runtime = "nodejs";

export async function GET() {
  try {
    const brief = await generateMarketBrief();
    return NextResponse.json(brief, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "market data unavailable" }, { status: 500 });
  }
}