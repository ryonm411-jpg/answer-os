import "dotenv/config";

async function testDirectNvidia() {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nvidia/llama-3.1-nemotron-70b-instruct",
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 20,
    }),
  });

  console.log("STATUS:", res.status);
  const text = await res.text();
  console.log("RESPONSE:", text);
}

testDirectNvidia().catch(console.error);
