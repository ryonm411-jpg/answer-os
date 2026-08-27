import "dotenv/config";
import { GroqProvider } from "../lib/providers/groq";
import { NvidiaProvider } from "../lib/providers/nvidia";

async function testActiveGroq() {
  console.log("--- Testing Active Groq Models ---");
  const models = ["groq/compound", "groq/compound-mini", "openai/gpt-oss-120b", "qwen/qwen3.6-27b"];
  for (const model of models) {
    try {
      const provider = new GroqProvider();
      const res = await provider.ask("Respond in JSON: {\"status\": \"ok\"}", { model });
      console.log(`[Groq SUCCESS] Model: ${model} -> ${res.content.trim()}`);
      return model;
    } catch (err: any) {
      console.log(`[Groq FAIL] Model: ${model} -> ${err.message}`);
    }
  }
}

async function testActiveNvidia() {
  console.log("--- Testing Active NVIDIA Models ---");
  const models = ["meta/llama-3.1-405b-instruct", "deepseek-ai/deepseek-v4-flash-0731", "nvidia/nemotron-4-340b-instruct", "ai21labs/jamba-1.5-large-instruct"];
  for (const model of models) {
    try {
      const provider = new NvidiaProvider();
      const res = await provider.ask("Respond in JSON: {\"status\": \"ok\"}", { model });
      console.log(`[NVIDIA SUCCESS] Model: ${model} -> ${res.content.trim()}`);
      return model;
    } catch (err: any) {
      console.log(`[NVIDIA FAIL] Model: ${model} -> ${err.message}`);
    }
  }
}

async function main() {
  await testActiveGroq();
  await testActiveNvidia();
}

main();
