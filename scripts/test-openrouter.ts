// Test script for OpenRouter integration
// Run with: npx tsx scripts/test-openrouter.ts
// Requires OPENROUTER_API_KEY in .env (Next.js loads .env automatically in dev)

import { callOpenRouter, simpleCompletion } from "../lib/openrouter";

async function testSimpleCompletion() {
  console.log("=== Test 1: Simple Completion ===");
  const result = await simpleCompletion(
    "You are a helpful assistant.",
    "Say hello in one short sentence."
  );
  console.log("Response:", result);
  console.log("Success:", !!result);
  console.log();
}

async function testToolCalling() {
  console.log("=== Test 2: Tool Calling ===");
  const tools = [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get current weather for a location",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string", description: "City name" },
          },
          required: ["location"],
        },
      },
    },
  ];

  try {
    const result = await callOpenRouter(
      [
        { role: "system", content: "You have access to a weather tool. Use it when asked about weather." },
        { role: "user", content: "What's the weather in Tokyo?" },
      ],
      { tools, toolChoice: "auto" }
    );
    console.log("Content:", result.content);
    console.log("Tool calls:", result.toolCalls);
    console.log("Success:", !!result.content || !!result.toolCalls?.length);
  } catch (err) {
    console.error("Tool calling test failed:", err);
  }
  console.log();
}

async function testRateLimitHandling() {
  console.log("=== Test 3: Error Handling (invalid key) ===");
  // Temporarily override with invalid key
  const originalKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = "invalid-key-test";

  try {
    await simpleCompletion("Test", "Test");
    console.log("ERROR: Should have failed with invalid key");
  } catch (err) {
    console.log("Correctly caught error:", err instanceof Error ? err.message : err);
  }

  process.env.OPENROUTER_API_KEY = originalKey;
  console.log();
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === "your_openrouter_api_key_here") {
    console.log("⚠️  OPENROUTER_API_KEY not set in .env");
    console.log("   Copy .env.example to .env and add your key from https://openrouter.ai/keys");
    return;
  }

  console.log("Testing OpenRouter integration...\n");
  await testSimpleCompletion();
  await testToolCalling();
  await testRateLimitHandling();
  console.log("=== All tests completed ===");
}

main().catch(console.error);