import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Cookie } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — AnswerOS",
  description:
    "Learn about essential and optional cookies and tracking technologies used by AnswerOS.",
};

export default function CookiePolicyPage() {
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
            <Cookie className="h-3.5 w-3.5" />
            Cookie &amp; Tracking Transparency
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: September 5, 2026 · Last Updated: September 5, 2026
          </p>
        </div>

        <section className="prose prose-invert max-w-none text-sm text-muted-foreground leading-relaxed space-y-6">
          <p>
            AnswerOS Inc. (&quot;AnswerOS&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) uses cookies and similar storage technologies to ensure platform security, enable authentication, and understand product usage. This Cookie Policy explains what cookies are, how we use them, and your rights to manage consent.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            1. What Are Cookies?
          </h2>
          <p>
            Cookies are small text files stored on your browser or device when you visit a website. They allow websites to recognize your session, remember preferences, and provide secure access to authorized areas.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            2. Categories of Cookies We Use
          </h2>

          <div className="space-y-4 my-6">
            <div className="bg-card border border-border p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">1. Strictly Necessary Cookies</h3>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  Always Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                Essential for core website functionality, authentication, and secure login handling via Clerk. The Service cannot function properly without these cookies.
              </p>
            </div>

            <div className="bg-card border border-border p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">2. Optional Analytics Cookies</h3>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                  Consent Required
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                Powered by PostHog to analyze page interactions, feature adoption, and performance bugs. These cookies help us improve AnswerOS experience but are non-essential and disabled by default until you grant consent.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            3. Managing Your Cookie Preferences
          </h2>
          <p>
            When you first visit AnswerOS, a cookie consent banner allows you to accept or reject non-essential analytics cookies. You can change your preference at any time:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">In-App Controls:</strong> Manage your privacy settings in the AnswerOS Account Settings page.
            </li>
            <li>
              <strong className="text-foreground">Browser Settings:</strong> You can configure your browser to block or delete cookies. Note that blocking necessary cookies will impact authentication and app access.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-foreground pt-4 border-t border-border/40">
            4. Third-Party Analytics Services
          </h2>
          <p>
            We use PostHog for product analytics. When optional analytics cookies are accepted, PostHog collects anonymized interaction data. You can view PostHog&apos;s privacy compliance details on our{" "}
            <Link href="/subprocessors" className="text-primary hover:underline font-medium">
              Subprocessors Page
            </Link>.
          </p>
        </section>
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
            <Link href="/cookies" className="text-primary font-medium">Cookie Policy</Link>
            <span>·</span>
            <Link href="/subprocessors" className="hover:text-foreground">Subprocessors</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
