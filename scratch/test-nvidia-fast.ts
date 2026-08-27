import "dotenv/config";
import { NvidiaProvider } from "../lib/providers/nvidia";

async function testNvidiaModels() {
  const models = [
    "01-ai/yi-large",
    "deepseek-ai/deepseek-coder-6.7b-instruct",
    "meta/llama-3.1-70b-instruct",
    "mistralai/mixtral-8x22b-instruct",
    "databricks/dbrx-instruct",
  ];

  for (const model of models) {
    console.log(`Testing NVIDIA model: ${model}...`);
    try {
      const provider = new NvidiaProvider();
      const res = await provider.ask("Reply with JSON: {\"ok\": true}", { model, timeoutMs: 15000 });
      console.log(`[NVIDIA SUCCESS] ${model} -> ${res.content.trim()}`);
      return model;
    } catch (err: any) {
      console.log(`[NVIDIA FAIL] ${model} -> ${err.message}`);
    }
  }
}

testNvidiaModels().catch(console.error);
