import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, ShieldCheck } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — AnswerOS",
  description:
    "Learn how AnswerOS collects, uses, protects, and handles your personal and business data.",
};

export default function PrivacyPolicyPage() {
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
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
        <div className="space-y-3 border-b border-border/60 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            PIPEDA Baseline & Global Privacy Standard
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: September 5, 2026 · Last Updated: September 5, 2026
          </p>
        </div>

        <section className="prose prose-invert max-w-none text-sm text-muted-foreground leading-relaxed space-y-6">
          <p>
            AnswerOS Inc. (&quot;AnswerOS&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) provides an AI search &amp; visibility optimization platform for B2B SaaS organizations. We respect your privacy and are committed to protecting personal and commercial information in accordance with applicable privacy laws, including the Canadian Personal Information Protection and Electronic Documents Act (PIPEDA) and international standards.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            1. Information We Collect
          </h2>
          <p>
            We adhere to the PIPEDA limiting-collection principle, collecting only information necessary to deliver, maintain, and secure AnswerOS services:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">Account &amp; Identity Data:</strong> Your name, email address, and authentication identifiers managed via Clerk.
            </li>
            <li>
              <strong className="text-foreground">Company &amp; Domain Profile:</strong> Organization name, tracked website domain, industry sector, product descriptions, and competitor lists.
            </li>
            <li>
              <strong className="text-foreground">Prompts &amp; Visibility Scans:</strong> User-customized prompts, AI-generated suggestions, scan parameters, raw provider outputs, mentions, sentiment scores, and domain citations.
            </li>
            <li>
              <strong className="text-foreground">Billing &amp; Subscription Details:</strong> Payment tokens, Stripe customer IDs, subscription tier, and transaction history. (Credit card numbers are processed directly by Stripe and never touch AnswerOS servers).
            </li>
            <li>
              <strong className="text-foreground">Technical &amp; Usage Logs:</strong> IP address, device specs, browser type, referral URLs, error logs (via Sentry), and optional product interaction analytics (via PostHog).
            </li>
          </ul>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            2. Purpose of Data Processing
          </h2>
          <p>
            We process your information exclusively for the following identified purposes:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs my-4">
              <thead>
                <tr className="border-b border-border text-foreground font-semibold">
                  <th className="py-2.5 px-3">Purpose</th>
                  <th className="py-2.5 px-3">Data Types Involved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr>
                  <td className="py-2 px-3 font-medium text-foreground">Service Delivery &amp; Auth</td>
                  <td className="py-2 px-3">Account identity, Clerk user tokens, domain settings</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-foreground">AI Scanning &amp; Scoring</td>
                  <td className="py-2 px-3">Domain name, product profile, custom &amp; curated prompts</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-foreground">Subscription &amp; Payment</td>
                  <td className="py-2 px-3">Stripe IDs, billing status, transaction records</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-foreground">System Stability &amp; Security</td>
                  <td className="py-2 px-3">Sentry stack traces, IP logs, auth tokens</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-foreground">Product Optimization</td>
                  <td className="py-2 px-3">PostHog event logs (subject to user consent)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            3. Third-Party Disclosures &amp; AI Providers
          </h2>
          <p>
            To execute AI search visibility scans, AnswerOS transmits your tracked business domain, product categories, and buyer question prompts to third-party AI LLM API providers (such as OpenAI, Anthropic, Google Gemini, Perplexity, Groq, NVIDIA, and OpenRouter).
          </p>
          <p>
            We do not sell, rent, or trade your personal data. We disclose information strictly to vetted subprocessors necessary for service operations. View our full list of infrastructure vendors on our{" "}
            <Link href="/subprocessors" className="text-primary hover:underline font-medium">
              Subprocessors Page
            </Link>.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            4. Consent &amp; Your Privacy Choice
          </h2>
          <p>
            By creating an account, you provide meaningful consent for the collection and processing of data required for primary service delivery.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">Secondary Purposes:</strong> Non-essential product analytics are optional. You can accept or decline non-essential cookies at any time via our cookie banner or Settings page.
            </li>
            <li>
              <strong className="text-foreground">Consent Withdrawal:</strong> You may withdraw consent for optional analytics or request full account termination at any time.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            5. Data Retention &amp; Self-Serve Deletion
          </h2>
          <p>
            Under PIPEDA&apos;s limiting-retention principle, we retain personal data only as long as necessary to fulfill identified business or legal purposes.
          </p>
          <p>
            You have the right to request deletion of your account and associated data. AnswerOS provides a self-serve account deletion control in your Account Settings. Executing account deletion immediately purges your user profile, company configuration, prompts, scan histories, AI recommendations, and provider preferences from our databases. Transactional invoice records may be retained as mandated by accounting and tax obligations.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            6. Security Safeguards
          </h2>
          <p>
            We implement administrative, technical, and physical safeguards appropriate to the sensitivity of your data. All database storage is encrypted at rest and in transit via TLS 1.3, managed via Neon PostgreSQL and Upstash Redis.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            7. Contact &amp; Privacy Officer
          </h2>
          <p>
            If you have questions, complaints, or inquiries regarding our privacy compliance or data handling, please contact our Privacy Team:
          </p>
          <div className="bg-card border border-border p-4 rounded-lg text-xs space-y-1">
            <p className="font-semibold text-foreground">AnswerOS Privacy Office</p>
            <p>Email: privacy@answeros.com</p>
            <p>Jurisdiction: Ontario, Canada</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-card/60 py-6 text-xs text-muted-foreground mt-auto">
        <div className="mx-auto max-w-5xl px-4 text-center space-y-2">
          <p>© {new Date().getFullYear()} AnswerOS Inc. All rights reserved.</p>
          <div className="flex justify-center items-center gap-4 text-[11px]">
            <Link href="/privacy" className="text-primary font-medium">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <span>·</span>
            <Link href="/cookies" className="hover:text-foreground">Cookie Policy</Link>
            <span>·</span>
            <Link href="/subprocessors" className="hover:text-foreground">Subprocessors</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
