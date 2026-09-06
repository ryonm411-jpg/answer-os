import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Database } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subprocessors — AnswerOS",
  description:
    "View the list of third-party subprocessors and service providers used by AnswerOS.",
};

interface Subprocessor {
  name: string;
  purpose: string;
  dataProcessed: string;
  location: string;
}

const subprocessorsList: Subprocessor[] = [
  {
    name: "Clerk Inc.",
    purpose: "User Authentication & Identity Management",
    dataProcessed: "Name, email address, auth tokens, login logs",
    location: "United States",
  },
  {
    name: "Stripe Inc.",
    purpose: "Subscription Billing & Payment Processing",
    dataProcessed: "Customer ID, email, payment card data (tokenized)",
    location: "United States",
  },
  {
    name: "Neon Inc.",
    purpose: "Serverless PostgreSQL Database Storage",
    dataProcessed: "User records, company profiles, prompts, scan results",
    location: "United States (AWS)",
  },
  {
    name: "Trigger.dev Inc.",
    purpose: "Background Task & Scan Orchestration Engine",
    dataProcessed: "Scan job parameters, task status logs",
    location: "United States",
  },
  {
    name: "Upstash Inc.",
    purpose: "Serverless Redis Cache & Rate Limiting",
    dataProcessed: "Cached scan metadata, temporary tokens",
    location: "United States",
  },
  {
    name: "Resend Inc.",
    purpose: "Transactional Email & Digest Reports Delivery",
    dataProcessed: "Recipient name, email address, email report content",
    location: "United States",
  },
  {
    name: "OpenAI LLC",
    purpose: "AI Model Provider (Search & Prompt Scanning)",
    dataProcessed: "Prompts, domain keywords, product descriptions",
    location: "United States",
  },
  {
    name: "Anthropic PBC",
    purpose: "AI Model Provider (Claude AI Scanning)",
    dataProcessed: "Prompts, domain keywords, product descriptions",
    location: "United States",
  },
  {
    name: "Google LLC",
    purpose: "AI Model Provider (Gemini Search & Visibility)",
    dataProcessed: "Prompts, domain keywords, product descriptions",
    location: "United States",
  },
  {
    name: "Perplexity AI Inc.",
    purpose: "AI Search Grounding & Citation Analysis",
    dataProcessed: "Prompts, domain queries, citation search queries",
    location: "United States",
  },
  {
    name: "Groq Inc.",
    purpose: "Fast AI Provider (Free Tier Scanning)",
    dataProcessed: "Prompts, domain queries",
    location: "United States",
  },
  {
    name: "NVIDIA Corp.",
    purpose: "NIM Microservice AI Provider (Free Tier Scanning)",
    dataProcessed: "Prompts, domain queries",
    location: "United States",
  },
  {
    name: "OpenRouter Inc.",
    purpose: "Multi-Model Router AI Provider (Free Tier Scanning)",
    dataProcessed: "Prompts, domain queries",
    location: "United States",
  },
  {
    name: "PostHog Inc.",
    purpose: "Product Usage Analytics (Optional Consent)",
    dataProcessed: "Anonymized click events, session engagement metrics",
    location: "United States / EU",
  },
  {
    name: "Functional Software Inc. (Sentry)",
    purpose: "Error Monitoring & Diagnostics",
    dataProcessed: "Application error logs, stack traces, IP addresses",
    location: "United States",
  },
];

export default function SubprocessorsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header / Brand Nav */}
      <header className="border-b border-border/80 bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 border border-primary/20 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              AnswerOS
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="space-y-3 border-b border-border/60 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Database className="h-3.5 w-3.5" />
            Data Subprocessor Disclosure
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Subprocessors List
          </h1>
          <p className="text-sm text-muted-foreground">
            Last Updated: September 5, 2026
          </p>
        </div>

        <div className="prose prose-invert max-w-none text-sm text-muted-foreground leading-relaxed">
          <p>
            To deliver AnswerOS service capabilities, we engage third-party service providers (&quot;Subprocessors&quot;) to perform essential infrastructure, payment, analytics, and AI processing functions. Each subprocessor is vetted for security compliance and bound by data protection obligations.
          </p>
        </div>

        {/* Subprocessors Table */}
        <div className="rounded-xl border border-border bg-card/40 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-card/80 text-foreground font-semibold">
                  <th className="py-3 px-4">Subprocessor</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Data Processed</th>
                  <th className="py-3 px-4">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-muted-foreground">
                {subprocessorsList.map((sp) => (
                  <tr key={sp.name} className="hover:bg-accent/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground whitespace-nowrap">
                      {sp.name}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground/90">
                      {sp.purpose}
                    </td>
                    <td className="py-3 px-4 leading-normal">
                      {sp.dataProcessed}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-foreground/70 font-mono text-[11px]">
                      {sp.location}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-card/60 py-6 text-xs text-muted-foreground mt-auto">
        <div className="mx-auto max-w-5xl px-4 text-center space-y-2">
          <p>© {new Date().getFullYear()} AnswerOS Inc. All rights reserved.</p>
          <div className="flex justify-center items-center gap-4 text-[11px]">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <span>·</span>
            <Link href="/cookies" className="hover:text-foreground">Cookie Policy</Link>
            <span>·</span>
            <Link href="/subprocessors" className="text-primary font-medium">Subprocessors</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
