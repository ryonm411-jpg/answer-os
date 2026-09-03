"use client";

import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FAQS = [
  {
    question: "What does AnswerOS actually scan?",
    answer:
      "AnswerOS scans buyer-intent questions across up to 6 AI search providers (Google Gemini, Groq, NVIDIA NIM, OpenAI, Anthropic Claude, and Perplexity). Each check evaluates whether your brand is mentioned, at what position, with what sentiment, and what competitors/citations appear. Results are cached in Redis with a 24-hour TTL to save AI costs.",
  },
  {
    question: "How long does a scan take?",
    answer:
      "Scans execute asynchronously in the background via Trigger.dev worker tasks so nothing blocks your web browser. A typical scan across 15+ prompt checks finishes in just 2 to 5 minutes.",
  },
  {
    question: "What is the visibility score and how is it calculated?",
    answer:
      "Your visibility score is a 0–100 metric calculated strictly server-side using five weighted factors: Mention Rate (30%), Average Rank (25%), Sentiment (20%), Competitor Share (15%), and Source Authority (10%). The current MVP maximum score ceiling is 95/100 until deeper web crawler data is released.",
  },
  {
    question: "What's included in the free tier?",
    answer:
      "The free tier includes full domain onboarding, prompt workspace access, and AI search visibility scans across all free AI models (Gemini, Groq LPU, and NVIDIA NIM). Premium models (OpenAI ChatGPT, Anthropic Claude, Perplexity) unlock when you subscribe.",
  },
  {
    question: "Do I need a credit card to try it?",
    answer:
      "No! You can sign up with email or Google, onboard your domain, review your prompts, and run your first scan on the free tier without entering any credit card details.",
  },
  {
    question: "How is my company data handled?",
    answer:
      "We only store your company domain, competitor domains, prompt set, and scan result metrics required to compute your dashboard. All product analytics are telemetry-only with strict no-PII enforcement.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="py-20 border-b border-border/60 bg-secondary/10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-medium border-border text-muted-foreground uppercase tracking-wider"
          >
            Got Questions?
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Everything you need to know about AI search visibility and AnswerOS.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <details
              key={index}
              className="group rounded-xl border border-border/80 bg-card/60 p-5 font-sans [&_summary::-webkit-details-marker]:hidden transition-all duration-200 open:bg-card/90 open:border-primary/40"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-foreground text-base hover:text-primary transition-colors">
                <span>{faq.question}</span>
                <span className="shrink-0 transition-transform duration-200 group-open:-rotate-180 text-muted-foreground group-open:text-primary">
                  <ChevronDown className="h-5 w-5" />
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
