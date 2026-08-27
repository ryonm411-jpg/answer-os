import "dotenv/config";

async function fetchGroqModels() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    console.log("GROQ MODELS:", data.data?.map((m: any) => m.id));
  } catch (e: any) {
    console.error("GROQ MODELS ERROR:", e.message);
  }
}

async function fetchNvidiaModels() {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) return;
  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    console.log("NVIDIA MODELS:", data.data?.slice(0, 10).map((m: any) => m.id));
  } catch (e: any) {
    console.error("NVIDIA MODELS ERROR:", e.message);
  }
}

async function main() {
  await fetchGroqModels();
  await fetchNvidiaModels();
}

main();
