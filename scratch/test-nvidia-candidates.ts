import "dotenv/config";
import { NvidiaProvider } from "../lib/providers/nvidia";

async function testNvidiaModels() {
  const models = [
    "mistralai/mistral-7b-instruct-v0.3",
    "ibm/granite-3.0-8b-instruct",
    "nvidia/llama-3.1-nemotron-70b-instruct",
    "mistralai/mistral-large-2-instruct",
  ];

  for (const model of models) {
    console.log(`Testing NVIDIA model: ${model}...`);
    try {
      const provider = new NvidiaProvider();
      const res = await provider.ask("Reply in JSON: {\"ok\": true}", { model, timeoutMs: 15000 });
      console.log(`[NVIDIA SUCCESS] ${model} -> ${res.content.trim()}`);
      return model;
    } catch (err: any) {
      console.log(`[NVIDIA FAIL] ${model} -> ${err.message}`);
    }
  }
}

testNvidiaModels().catch(console.error);
