import "dotenv/config";

async function main() {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await res.json();
  const allIds: string[] = data.data.map((m: any) => m.id);
  console.log("TOTAL NVIDIA MODELS:", allIds.length);
  console.log("CHAT / INSTRUCT MODELS:", allIds.filter(id => id.includes("instruct") || id.includes("chat") || id.includes("llama") || id.includes("mistral") || id.includes("nemotron")));
}

main().catch(console.error);
