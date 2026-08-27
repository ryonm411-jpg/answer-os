import "dotenv/config";

async function testAllNvidiaModelsWithKey() {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await res.json();
  const allIds: string[] = data.data.map((m: any) => m.id);

  console.log(`Testing ${allIds.length} NVIDIA models for active access...`);

  for (const model of allIds) {
    try {
      const resp = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 5,
        }),
      });

      if (resp.status === 200) {
        console.log(`>>> SUCCESS NVIDIA MODEL: ${model} <<<`);
        return model;
      } else {
        const text = await resp.text();
        if (!text.includes("Not found") && !text.includes("410")) {
          console.log(`[Status ${resp.status}] ${model} -> ${text.substring(0, 100)}`);
        }
      }
    } catch (e: any) {
      // ignore network errors
    }
  }

  console.log("No active working models found for this NVIDIA API Key.");
}

testAllNvidiaModelsWithKey().catch(console.error);
