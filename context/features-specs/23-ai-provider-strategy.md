# Feature Spec 23 — AnswerOS AI Provider Strategy & Usage Guidelines

## Objective

Establish a clear, provider-specific usage strategy for AnswerOS so each AI model has a defined role, custom limits, controlled execution rules, and transparent scoring contribution without burdening end-users with engineering diagnostics.

---

## 1. Provider Roles & Usage Strategy

| Provider | Role in AnswerOS | Strengths & Best Use | Limitations & Error Mitigations | Concurrency & Budgeting Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Google Gemini** (`gemini-3.6-flash`) | **Free Baseline & Prompt Suggestions** | Fast response times, multimodal understanding, AI prompt generator | Free tier rate limit (20 RPM). Mitigation: Controlled concurrency and request pacing. | `maxConcurrency: 2`, `RPM: 20`, `timeout: 30s`, `canonical: true` |
| **Groq LPU** (`groq/compound`) | **Ultra-Fast Auxiliary Preview** | Sub-second inference (Llama 3.3 70B & Qwen) | Strict TPM limits (8,000 TPM free) and 413 Payload caps. Mitigation: Small prompts & pre-dispatch token budget check. | `maxConcurrency: 2`, `TPM: 8,000`, `timeout: 20s`, `canonical: false` (auxiliary) |
| **NVIDIA NIM** (`deepseek-ai/deepseek-v4-flash-0731`) | **Auxiliary Open Model Coverage** | Open DeepSeek model evaluation & diversity | Server cold-start latency & timeouts. Mitigation: Longer timeout (45s) and non-blocking background execution. | `maxConcurrency: 2`, `timeout: 45s`, `canonical: false` (auxiliary) |
| **OpenRouter** (`openrouter/auto`) | **Auxiliary Experimental Pool** | Broad open-source model exploration | Dynamic target model switching (`openrouter/auto`) causing variable JSON compliance. | `maxConcurrency: 2`, `timeout: 30s`, `canonical: false` (auxiliary) |
| **OpenAI ChatGPT** (`gpt-4o`) | **Paid Canonical Benchmark** | Industry benchmark AI search visibility, reliable JSON mode | Paid subscription gating. | `maxConcurrency: 5`, `timeout: 60s`, `canonical: true` |
| **Anthropic Claude** (`claude-3-5-sonnet-latest`) | **Paid Canonical Reasoning Engine** | Superior long-context reasoning, competitive gap & recommendations | Paid subscription gating. | `maxConcurrency: 4`, `timeout: 60s`, `canonical: true` |
| **Perplexity AI** (`sonar`) | **Paid Canonical Search Engine** | Real-time web search grounding & source citations | Paid subscription gating. Mitigation: Extract source domain citations into `ScanResultCitation`. | `maxConcurrency: 4`, `timeout: 45s`, `supportsCitations: true`, `canonical: true` |

---

## 2. Architectural Principles

1. **No Universal Provider Limits**:
   - Each provider maintains its own `ProviderProfile` with tailored `maxConcurrency`, `requestTimeoutMs`, `requestsPerMinute`, and `tokensPerMinute`.
   - NVIDIA latency issues do not slow down Gemini or OpenAI execution queues.

2. **Pre-Dispatch Token & Payload Budgeting**:
   - Check input payload size before calling provider endpoints. If estimated tokens exceed the provider's `tokensPerMinute` budget, return an error result without sending a failing API call.

3. **Non-Blocking Failed-Check Isolation**:
   - If a single provider check times out or fails, record an isolated error row in `ScanResult` while allowing the rest of the scan to complete.

4. **Canonical vs. Auxiliary Scoring Distinction**:
   - **Canonical Providers** (OpenAI, Anthropic, Gemini, Perplexity) directly compute historical Visibility Scores.
   - **Auxiliary Providers** (Groq, NVIDIA, OpenRouter) provide extra coverage insights without skewing historical score benchmarks.

5. **Clean User-Facing Communication**:
   - Present simple, actionable metrics in the UI (e.g. **Scan Coverage: 94% — 94% of requested checks completed successfully**).
   - Keep internal engineering details (such as NIM cold-start latency or HTTP status codes) out of primary customer dashboards.
