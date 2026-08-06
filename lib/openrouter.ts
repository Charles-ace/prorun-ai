// OpenRouter LLM client — uses fetch directly, no SDK needed.
// Free models: mistralai/mistral-7b-instruct:free, google/gemma-2-9b-it:free, meta-llama/llama-3.2-3b-instruct:free
// Docs: https://openrouter.ai/docs

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  tool_calls?: OpenRouterToolCall[];
  tool_call_id?: string;
}

export interface OpenRouterToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    index: number;
    message: OpenRouterMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterError {
  error: {
    message: string;
    type: string;
    code?: number;
  };
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: unknown[];
  toolChoice?: "auto" | "none" | { type: "function"; function: { name: string } };
}

const DEFAULT_MODEL = "mistralai/mistral-7b-instruct:free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function getHeaders(): Record<string, string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // During build/static generation, return empty headers - calls will fail gracefully
    if (process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-export") {
      return {};
    }
    throw new Error("OPENROUTER_API_KEY not set in environment");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_SITE_NAME || "Prorun AI",
  };
}

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: LLMOptions = {}
): Promise<{ content: string | null; toolCalls: OpenRouterToolCall[] | null }> {
  // During build, return null to avoid errors
  if (!process.env.OPENROUTER_API_KEY && (process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-export")) {
    return { content: null, toolCalls: null };
  }

  const model = options.model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.5,
    max_tokens: options.maxTokens ?? 900,
    ...(options.tools ? { tools: options.tools, tool_choice: options.toolChoice ?? "auto" } : {}),
  };

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get("retry-after");
      throw new Error(`Rate limited (429). ${retryAfter ? `Retry after ${retryAfter}s` : "Please wait before retrying."}`);
    }

    if (!res.ok) {
      const errorData = (await res.json().catch(() => ({}))) as OpenRouterError;
      throw new Error(`OpenRouter error (${res.status}): ${errorData.error?.message || res.statusText}`);
    }

    const data = (await res.json()) as OpenRouterResponse;
    const message = data.choices?.[0]?.message;

    if (!message) {
      throw new Error("No message in OpenRouter response");
    }

    return {
      content: message.content ?? null,
      toolCalls: message.tool_calls ?? null,
    };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Unknown error calling OpenRouter");
  }
}

export async function simpleCompletion(
  systemPrompt: string,
  userPrompt: string,
  options: LLMOptions = {}
): Promise<string | null> {
  try {
    const result = await callOpenRouter(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      options
    );
    return result.content;
  } catch (err) {
    console.error("OpenRouter completion failed:", err);
    return null;
  }
}