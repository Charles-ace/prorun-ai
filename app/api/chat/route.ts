import { NextResponse } from "next/server";
import type { ChatContext, ChatMessage } from "@/lib/types";
import { buildAssistantReply, DISCLAIMER } from "@/lib/chat";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, context, history } = body as {
      question?: string;
      context?: ChatContext;
      history?: ChatMessage[];
    };
    if (!question) {
      return NextResponse.json({ error: "question required" }, { status: 400 });
    }
    const { reply, toolCalls } = await buildAssistantReply(
      question,
      (context ?? {}) as ChatContext,
      history ?? [],
    );
    return NextResponse.json({ reply, toolCalls });
  } catch {
    return NextResponse.json({ reply: DISCLAIMER, toolCalls: [] }, { status: 200 });
  }
}
