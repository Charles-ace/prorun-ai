process.env.OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free";

async function main() {
  const { buildAssistantReply } = await import("../lib/chat");
  const r = await buildAssistantReply("Say hello in 5 words", {}, []);
  console.log(JSON.stringify(r, null, 2));
}

main().catch((e) => {
  console.error("THREW:", e);
  process.exit(1);
});
