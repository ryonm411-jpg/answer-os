import "dotenv/config";
import { GroqProvider } from "../lib/providers/groq";
import { NvidiaProvider } from "../lib/providers/nvidia";
import { GeminiProvider } from "../lib/providers/gemini";
import { OpenRouterProvider } from "../lib/providers/openrouter";

async function testGroq() {
  console.log("--- Testing Groq ---");
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-70b-8192", "mixtral-8x7b-32768"];
  for (const model of models) {
    try {
      const provider = new GroqProvider();
      const res = await provider.ask("Hello, respond in one word.", { model });
      console.log(`[Groq SUCCESS] Model: ${model} -> ${res.content.trim()}`);
      return model;
    } catch (err: any) {
      console.log(`[Groq FAIL] Model: ${model} -> ${err.message}`);
    }
  }
}

async function testNvidia() {
  console.log("--- Testing NVIDIA ---");
  const models = ["meta/llama-3.3-70b-instruct", "meta/llama3-70b-instruct", "nvidia/llama-3.1-nemotron-70b-instruct", "mistralai/mistral-7b-instruct-v0.2"];
  for (const model of models) {
    try {
      const provider = new NvidiaProvider();
      const res = await provider.ask("Hello, respond in one word.", { model });
      console.log(`[NVIDIA SUCCESS] Model: ${model} -> ${res.content.trim()}`);
      return model;
    } catch (err: any) {
      console.log(`[NVIDIA FAIL] Model: ${model} -> ${err.message}`);
    }
  }
}

async function testGemini() {
  console.log("--- Testing Gemini ---");
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
  for (const model of models) {
    try {
      const provider = new GeminiProvider();
      const res = await provider.ask("Hello, respond in one word.", { model });
      console.log(`[Gemini SUCCESS] Model: ${model} -> ${res.content.trim()}`);
      return model;
    } catch (err: any) {
      console.log(`[Gemini FAIL] Model: ${model} -> ${err.message}`);
    }
  }
}

async function testOpenRouter() {
  console.log("--- Testing OpenRouter ---");
  const models = ["openrouter/auto", "meta-llama/llama-3.3-70b-instruct:free", "google/gemini-2.0-flash-exp:free"];
  for (const model of models) {
    try {
      const provider = new OpenRouterProvider();
      const res = await provider.ask("Hello, respond in one word.", { model });
      console.log(`[OpenRouter SUCCESS] Model: ${model} -> ${res.content.trim()}`);
      return model;
    } catch (err: any) {
      console.log(`[OpenRouter FAIL] Model: ${model} -> ${err.message}`);
    }
  }
}

async function main() {
  await testGroq();
  await testNvidia();
  await testGemini();
  await testOpenRouter();
}

main().catch(console.error);
