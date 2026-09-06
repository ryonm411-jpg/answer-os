import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, AlertTriangle } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — AnswerOS",
  description:
    "Read the terms and conditions governing the use of AnswerOS services and subscription platform.",
};

export default function TermsOfServicePage() {
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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: September 5, 2026 · Last Updated: September 5, 2026
          </p>
        </div>

        {/* AI Disclaimer Alert Box */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-amber-200/90 text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Important AI Search &amp; Recommendation Disclaimer</span>
          </div>
          <p className="leading-relaxed">
            AnswerOS provides AI search visibility benchmarking, rank tracking, and optimization suggestions based on probabilistic AI model responses. <strong>AI visibility scores, rankings, recommendations, citations, and predictions are informational only and do NOT constitute guarantees of placement, ranking, or performance in third-party AI search engines or LLM outputs.</strong> AI provider algorithms fluctuate dynamically without notice.
          </p>
        </div>

        <section className="prose prose-invert max-w-none text-sm text-muted-foreground leading-relaxed space-y-6">
          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            1. Agreement &amp; Acceptance
          </h2>
          <p>
            By creating an account, accessing, or subscribing to AnswerOS (&quot;Service&quot;), provided by AnswerOS Inc. (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), you agree to be bound by these Terms of Service. If you are accepting on behalf of an organization, you represent that you have the authority to bind that entity.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            2. Account Registration &amp; Security
          </h2>
          <p>
            You must provide accurate information when registering for an account. You are responsible for maintaining the confidentiality of your credentials and for all activities occurring under your account. You must notify us immediately of any unauthorized access.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            3. Subscriptions, Payments &amp; Cancellations
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">Subscription Billing:</strong> Subscriptions are billed in advance on a recurring monthly or annual basis via Stripe.
            </li>
            <li>
              <strong className="text-foreground">Cancellation Policy:</strong> You may cancel your subscription at any time through your Billing portal. Upon cancellation, your subscription remains active until the end of your current billing period. No further recurring charges will be made.
            </li>
            <li>
              <strong className="text-foreground">Refund Policy:</strong> Payments are non-refundable except where required by applicable law or explicitly stated in writing. We do not issue prorated refunds for partial billing periods.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            4. Acceptable Use Policy
          </h2>
          <p>
            You agree not to use AnswerOS to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Violate any local, national, or international laws or regulations.</li>
            <li>Attempt to bypass API limits, perform denial-of-service attacks, or reverse-engineer the Service.</li>
            <li>Generate deceptive, defamatory, or malicious prompts targeting third parties.</li>
            <li>Resell or redistribute AnswerOS API outputs without authorization.</li>
          </ul>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            5. Intellectual Property &amp; Customer Data
          </h2>
          <p>
            <strong className="text-foreground">Customer Data Ownership:</strong> You retain ownership of all organization domains, prompts, and business profiles submitted to AnswerOS. You grant us a non-exclusive license to process customer data solely to operate and provide the Service.
          </p>
          <p>
            <strong className="text-foreground">Platform IP:</strong> AnswerOS retains all rights, title, and interest in the platform software, scoring algorithms, design systems, and trademarks.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            6. Service Availability &amp; Modifications
          </h2>
          <p>
            We strive to maintain high service availability but do not guarantee uninterrupted operation. We reserve the right to update, modify, or deprecate feature sets or third-party AI provider integrations to improve performance or adapt to provider changes.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            7. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, AnswerOS Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, market share, data, or goodwill, arising from or related to your use of the Service or reliance on AI-generated recommendations.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            8. Governing Law &amp; Jurisdiction
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of law principles.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            9. Contact Information
          </h2>
          <p>
            For questions regarding these Terms of Service, please reach out to:
          </p>
          <div className="bg-card border border-border p-4 rounded-lg text-xs space-y-1">
            <p className="font-semibold text-foreground">AnswerOS Legal Department</p>
            <p>Email: legal@answeros.com</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-card/60 py-6 text-xs text-muted-foreground mt-auto">
        <div className="mx-auto max-w-5xl px-4 text-center space-y-2">
          <p>© {new Date().getFullYear()} AnswerOS Inc. All rights reserved.</p>
          <div className="flex justify-center items-center gap-4 text-[11px]">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="text-primary font-medium">Terms of Service</Link>
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
