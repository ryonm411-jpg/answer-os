"use client";

import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FAQS = [
  {
    question: "What does AnswerOS actually scan?",
    answer:
      "AnswerOS scans buyer-intent queries across 6 AI providers (Google Gemini, Groq, NVIDIA NIM, OpenAI ChatGPT, Anthropic Claude, and Perplexity). Each scan evaluates whether your brand is mentioned, what position rank it holds, the sentiment tone, and which competing brands and web publications are cited.",
  },
  {
    question: "How does the free scan work?",
    answer:
      "When you enter your company website, AnswerOS generates category-specific buyer questions and queries our free AI providers (Gemini, Groq, NVIDIA NIM). You get an instant preview of your brand's AI search footprint with zero payment or credit card required.",
  },
  {
    question: "What exactly is AI visibility?",
    answer:
      "AI visibility measures how frequently and favorably your brand appears when prospective customers ask AI search engines and assistants for recommendations, comparisons, and solutions in your category.",
  },
  {
    question: "What do I get without paying?",
    answer:
      "On the Free Tier, you get full domain onboarding, prompt workspace access, and AI visibility scanning across 3 core providers (Gemini, Groq, NVIDIA NIM), plus visibility scoring, competitor mentions, and prioritized recommendations.",
  },
  {
    question: "How long does a scan take?",
    answer:
      "Scans run in the background so your browser never freezes. A typical scan across a full set of category prompts completes in approximately 2 to 4 minutes.",
  },
  {
    question: "Why can AI answers change between scans?",
    answer:
      "AI models generate responses probabilistically and continuously ingest updated web data, reviews, and citations. That's why recurring monitoring is essential to detect when your rank or competitor share shifts.",
  },
  {
    question: "How is the visibility score calculated?",
    answer:
      "Your 0–100 score is computed server-side using five weighted factors: Mention Rate (30%), Average Rank (25%), Sentiment (20%), Competitor Share (15%), and Source Authority (10%).",
  },
  {
    question: "Does AnswerOS guarantee that AI will recommend my brand?",
    answer:
      "No. No platform can control what AI models ultimately output. AnswerOS provides empirical diagnostic data, citation tracking, and evidence-based recommendations to help you create the content and schema that AI engines favor.",
  },
  {
    question: "How is my company data handled?",
    answer:
      "We only store your company domain, competitor domains, prompt sets, and scan metrics necessary to compute your dashboard. All analytics are strictly telemetry-only with zero personal data collection.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="py-20 md:py-24 border-b border-[#252D3A] bg-[#101521]/60">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-medium border-[#252D3A] bg-[#141A26] text-[#5B8CFF] uppercase tracking-wider"
          >
            FAQ
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-[#9AA4B2]">
            Clear, transparent answers about AI search visibility and how AnswerOS works.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <details
              key={index}
              className="group rounded-2xl border border-[#252D3A] bg-[#141A26]/80 p-5 font-sans [&_summary::-webkit-details-marker]:hidden transition-all duration-200 open:bg-[#141A26] open:border-[#5B8CFF]/40 shadow-sm"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-[#F5F7FA] text-base hover:text-[#5B8CFF] transition-colors">
                <span>{faq.question}</span>
                <span className="shrink-0 transition-transform duration-200 group-open:-rotate-180 text-[#9AA4B2] group-open:text-[#5B8CFF]">
                  <ChevronDown className="h-5 w-5" />
                </span>
              </summary>
              <p className="mt-3 text-sm text-[#9AA4B2] leading-relaxed border-t border-[#252D3A]/60 pt-3">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
