"use client";

import * as React from "react";
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Globe,
  MessageSquare,
  Lightbulb,
  Building2,
  ShoppingBag,
  Briefcase,
  Plane,
  Layers
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { trackClientEvent } from "@/lib/analytics/posthog-client";
import { EVENTS } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

interface SampleCategoryData {
  id: string;
  category: string;
  icon: React.ElementType;
  query: string;
  targetBrand: string;
  rank: number;
  mentioned: boolean;
  sentiment: string;
  sentimentScore: number;
  competitors: Array<{ name: string; position: string; reason: string }>;
  aiSnippet: {
    engine: string;
    brandA: { name: string; desc: string };
    brandYour: { name: string; desc: string };
  };
  sources: string[];
  recommendation: {
    title: string;
    description: string;
    type: string;
  };
}

const SAMPLE_REPORTS: SampleCategoryData[] = [
  {
    id: "software",
    category: "Software & SaaS",
    icon: Layers,
    query: "What are the best project management tools for remote teams?",
    targetBrand: "Your Brand (e.g., Linear)",
    rank: 2,
    mentioned: true,
    sentiment: "Positive",
    sentimentScore: 0.91,
    competitors: [
      { name: "Brand A (Asana)", position: "Rank #1", reason: "Cited for enterprise workflow templates and broad app integrations." },
      { name: "Your Brand (Linear)", position: "Rank #2", reason: "Recommended for streamlined keyboard shortcuts and fast sprint planning." },
      { name: "Brand C (Monday.com)", position: "Rank #3", reason: "Mentioned for visual boards and non-technical team collaboration." },
    ],
    aiSnippet: {
      engine: "OpenAI ChatGPT & Claude Consensus",
      brandA: {
        name: "1. Brand A",
        desc: "Best for large organizations needing strict permissions, extensive cross-team boards, and legacy integrations.",
      },
      brandYour: {
        name: "2. Your Brand",
        desc: "Best for modern high-velocity teams looking for minimal friction, automated sprint cycles, and developer-first design.",
      },
    },
    sources: ["Forbes Advisor", "Reddit (r/productivity)", "G2 Crowd Reviews", "TechRadar", "Company Documentation"],
    recommendation: {
      type: "Comparison Content Gap",
      title: "Create a dedicated comparison page targeting Brand A vs Your Brand",
      description: "AI models frequently cite 3rd-party comparison blogs when answering migration queries where your brand is mentioned 2nd.",
    },
  },
  {
    id: "ecommerce",
    category: "Ecommerce & Retail",
    icon: ShoppingBag,
    query: "What are the best running shoes for marathon training?",
    targetBrand: "Your Brand (e.g., Endorphin Pro)",
    rank: 2,
    mentioned: true,
    sentiment: "Positive",
    sentimentScore: 0.89,
    competitors: [
      { name: "Brand A (Nike Vaporfly)", position: "Rank #1", reason: "Cited for elite race-day performance and carbon-plate responsiveness." },
      { name: "Your Brand (Saucony Endorphin)", position: "Rank #2", reason: "Recommended for high-cushion durability during 20+ mile training blocks." },
      { name: "Brand C (Hoka Mach)", position: "Rank #3", reason: "Mentioned for everyday recovery runs and wide foot comfort." },
    ],
    aiSnippet: {
      engine: "Google Gemini & Groq Consensus",
      brandA: {
        name: "1. Brand A",
        desc: "Top recommendation for competitive race day speed and energy return, favored by elite marathoners.",
      },
      brandYour: {
        name: "2. Your Brand",
        desc: "Ideal for long-distance training blocks combining bouncy superfoam with extended outsole lifespan.",
      },
    },
    sources: ["Runner's World", "Reddit (r/RunningShoeGeeks)", "RunRepeat Lab Tests", "Wirecutter", "Brand Specs"],
    recommendation: {
      type: "Review & Specification Gap",
      title: "Publish structured durability specs and training shoe comparison guides",
      description: "AI search frequently references laboratory wear-test comparisons when recommending shoes for long-distance training.",
    },
  },
  {
    id: "services",
    category: "Professional Services",
    icon: Briefcase,
    query: "What are the best accounting firms for small businesses and startups?",
    targetBrand: "Your Brand (e.g., Pilot / Kruze)",
    rank: 2,
    mentioned: true,
    sentiment: "Positive",
    sentimentScore: 0.94,
    competitors: [
      { name: "Brand A (Bench Accounting)", position: "Rank #1", reason: "Cited for all-in-one monthly bookkeeping and straightforward cash-basis reporting." },
      { name: "Your Brand (Pilot)", position: "Rank #2", reason: "Recommended for accrual bookkeeping, R&D tax credit filing, and CFO advisory." },
      { name: "Brand C (QuickBooks Live)", position: "Rank #3", reason: "Mentioned for budget-conscious solo operators already on Intuit." },
    ],
    aiSnippet: {
      engine: "Perplexity & Claude Consensus",
      brandA: {
        name: "1. Brand A",
        desc: "Best suited for small service businesses seeking standardized monthly financial statements and dedicated bookkeepers.",
      },
      brandYour: {
        name: "2. Your Brand",
        desc: "Top choice for funded startups needing GAAP-compliant books, multi-entity support, and fractional CFO advisory.",
      },
    },
    sources: ["Forbes SMB", "Reddit (r/smallbusiness)", "Clutch.co", "Startup CFO Blog", "AICPA Directory"],
    recommendation: {
      type: "Positioning & Citation Gap",
      title: "Build category authority around R&D tax credits and startup compliance FAQs",
      description: "AI engines cite specialized tax guides when buyers ask about accounting options for growing companies.",
    },
  },
  {
    id: "travel",
    category: "Travel & Hospitality",
    icon: Plane,
    query: "What are the best family hotels in Vancouver with kids activities?",
    targetBrand: "Your Brand (e.g., Pacific Rim)",
    rank: 2,
    mentioned: true,
    sentiment: "Positive",
    sentimentScore: 0.88,
    competitors: [
      { name: "Brand A (Pan Pacific Vancouver)", position: "Rank #1", reason: "Cited for waterfront rooftop pool and walking distance to cruise terminal." },
      { name: "Your Brand (Fairmont Pacific Rim)", position: "Rank #2", reason: "Recommended for family suites, bike rentals, and central Stanley Park access." },
      { name: "Brand C (Westin Bayshore)", position: "Rank #3", reason: "Mentioned for seawall views and outdoor garden spaces." },
    ],
    aiSnippet: {
      engine: "OpenAI ChatGPT & Google Gemini",
      brandA: {
        name: "1. Brand A",
        desc: "Frequently recommended for panoramic harbour views, immediate cruise port proximity, and heated outdoor pool.",
      },
      brandYour: {
        name: "2. Your Brand",
        desc: "Excellent luxury choice for families offering spacious connecting rooms, kid-friendly concierge amenities, and downtown park access.",
      },
    },
    sources: ["TripAdvisor Reviews", "Condé Nast Traveler", "Travel + Leisure", "Family Vacation Critic", "Destination BC"],
    recommendation: {
      type: "Local Guide & Schema Gap",
      title: "Add FAQ schema for family amenities (cribs, connecting rooms, seasonal pools)",
      description: "AI travel assistants pull exact amenity data from structured web citations when answering family travel prompts.",
    },
  },
  {
    id: "agencies",
    category: "Agencies & Growth",
    icon: Building2,
    query: "What are the best marketing agencies for a growing brand?",
    targetBrand: "Your Brand (e.g., Growth Collective)",
    rank: 2,
    mentioned: true,
    sentiment: "Positive",
    sentimentScore: 0.92,
    competitors: [
      { name: "Brand A (Single Grain)", position: "Rank #1", reason: "Cited for full-funnel paid media and enterprise SEO audits." },
      { name: "Your Brand (Growth Collective)", position: "Rank #2", reason: "Recommended for pre-vetted freelance marketers and flexible monthly retainers." },
      { name: "Brand C (Disruptive Advertising)", position: "Rank #3", reason: "Mentioned for high-volume PPC management and Google Ads optimization." },
    ],
    aiSnippet: {
      engine: "Claude & Groq Consensus",
      brandA: {
        name: "1. Brand A",
        desc: "Recommended for companies wanting a comprehensive full-service digital strategy and dedicated account teams.",
      },
      brandYour: {
        name: "2. Your Brand",
        desc: "Ideal for growth-stage businesses that want elite fractional marketers matched directly to their specific niche.",
      },
    },
    sources: ["HubSpot Agency Blog", "Clutch Top Agencies", "AgencyAnalytics", "MarketerHire Review", "UpCity"],
    recommendation: {
      type: "Case Study & Review Gap",
      title: "Publish verified client ROI case studies on prominent B2B directory portals",
      description: "AI engines cite verified review directories when assessing agency track records and client satisfaction.",
    },
  },
];

export function ScanPreviewShowcase() {
  const [selectedId, setSelectedId] = React.useState<string>("software");
  const currentReport = SAMPLE_REPORTS.find((r) => r.id === selectedId) || SAMPLE_REPORTS[0];

  const handleSelectCategory = (id: string) => {
    setSelectedId(id);
    trackClientEvent(EVENTS.LANDING_CTA_CLICKED, { cta: `sample_category_${id}` });
  };

  return (
    <section id="sample-report" className="py-20 md:py-28 border-b border-[#252D3A] bg-[#080B12] relative overflow-hidden">
      {/* Background Accent Gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-[#5B8CFF]/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141A26] border border-[#252D3A] text-xs font-semibold text-[#5B8CFF] uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Real Report Output</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
            See what AnswerOS actually reveals.
          </h2>
          <p className="text-base sm:text-lg text-[#9AA4B2]">
            Know who AI recommends, why they were chosen, which sources were cited, and the exact steps to improve your visibility.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center">
          <div className="flex flex-wrap items-center justify-center p-1.5 rounded-2xl bg-[#101521] border border-[#252D3A] gap-1.5 shadow-lg">
            {SAMPLE_REPORTS.map((report) => {
              const Icon = report.icon;
              const isSelected = report.id === selectedId;
              return (
                <button
                  key={report.id}
                  onClick={() => handleSelectCategory(report.id)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer",
                    isSelected
                      ? "bg-[#5B8CFF] text-white shadow-md font-semibold"
                      : "text-[#9AA4B2] hover:text-[#F5F7FA] hover:bg-[#141A26]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{report.category}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Realistic Sample Report Mock Container */}
        <div className="bg-[#141A26] border border-[#252D3A] rounded-2xl shadow-2xl overflow-hidden transition-all">
          {/* Top Bar */}
          <div className="px-5 py-3.5 bg-[#101521] border-b border-[#252D3A] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#29C78F]" />
              <span className="ml-2 font-mono text-[11px] text-[#9AA4B2]">
                AnswerOS AI Visibility Report • {currentReport.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#29C78F]/15 text-[#29C78F] font-semibold flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Live Consensus across 6 AI Providers
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Scanned Buyer Question */}
            <div className="bg-[#080B12] border border-[#252D3A] rounded-xl p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-[#5B8CFF] font-semibold uppercase tracking-wider">
                  Buyer Query Tested in AI Search
                </span>
                <span className="text-[#9AA4B2]">{currentReport.aiSnippet.engine}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#F5F7FA]">
                &ldquo;{currentReport.query}&rdquo;
              </h3>
            </div>

            {/* Main 2-Column Split: AI Answer Consensus + Visibility Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: The Simulated AI Answer */}
              <div className="lg:col-span-7 bg-[#080B12]/90 border border-[#252D3A] rounded-xl p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#252D3A]">
                  <span className="text-xs font-semibold text-[#9AA4B2] uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-[#5B8CFF]" />
                    AI Search Recommendation Output
                  </span>
                  <span className="text-[11px] text-[#6B778C]">Raw Consensus</span>
                </div>

                {/* AI Answer Content */}
                <div className="space-y-4 text-xs sm:text-sm text-[#9AA4B2] leading-relaxed">
                  {/* Competitor 1 */}
                  <div className="p-3.5 rounded-lg bg-[#101521] border border-[#252D3A]/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F5F7FA]">{currentReport.aiSnippet.brandA.name}</span>
                      <span className="text-[11px] text-[#9AA4B2]">Rank #1</span>
                    </div>
                    <p className="text-xs text-[#9AA4B2]">{currentReport.aiSnippet.brandA.desc}</p>
                  </div>

                  {/* Target Brand (Highlighted) */}
                  <div className="p-3.5 rounded-lg bg-[#5B8CFF]/10 border border-[#5B8CFF]/40 space-y-1 relative">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-2">
                        {currentReport.aiSnippet.brandYour.name}
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#29C78F]/20 text-[#29C78F] font-semibold">
                          Mentioned
                        </span>
                      </span>
                      <span className="text-xs font-bold text-[#5B8CFF]">Rank #2</span>
                    </div>
                    <p className="text-xs text-[#F5F7FA]/90">{currentReport.aiSnippet.brandYour.desc}</p>
                  </div>
                </div>

                {/* Cited Sources List */}
                <div className="pt-3 border-t border-[#252D3A] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#9AA4B2]">
                    <Globe className="h-3.5 w-3.5 text-[#5B8CFF]" />
                    <span className="font-medium text-[#F5F7FA]">Influential Cited Sources:</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {currentReport.sources.map((source, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-[#101521] border border-[#252D3A] text-[#9AA4B2] text-[11px]"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Visibility Summary + Recommendation */}
              <div className="lg:col-span-5 space-y-4">
                {/* Visibility Stats Card */}
                <div className="bg-[#080B12]/90 border border-[#252D3A] rounded-xl p-5 space-y-4">
                  <span className="text-xs font-semibold text-[#9AA4B2] uppercase tracking-wider">
                    AnswerOS Detection Signals
                  </span>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-lg bg-[#101521] border border-[#252D3A]">
                      <span className="text-[10px] text-[#9AA4B2] uppercase block">Mention Status</span>
                      <span className="text-xs sm:text-sm font-bold text-[#29C78F] mt-1 block">Mentioned</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#101521] border border-[#252D3A]">
                      <span className="text-[10px] text-[#9AA4B2] uppercase block">AI Rank</span>
                      <span className="text-xs sm:text-sm font-bold text-[#5B8CFF] mt-1 block">Rank #2</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#101521] border border-[#252D3A]">
                      <span className="text-[10px] text-[#9AA4B2] uppercase block">Sentiment</span>
                      <span className="text-xs sm:text-sm font-bold text-[#29C78F] mt-1 block">Positive (0.91)</span>
                    </div>
                  </div>

                  {/* Competitor Overview */}
                  <div className="space-y-2 pt-2 border-t border-[#252D3A]">
                    <span className="text-[11px] font-medium text-[#9AA4B2] block">
                      Competitors Appearing in Same Answers:
                    </span>
                    <div className="space-y-1.5">
                      {currentReport.competitors.map((comp, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 px-2.5 rounded bg-[#101521]">
                          <span className="text-[#F5F7FA] font-medium">{comp.name}</span>
                          <span className="text-[#9AA4B2] font-mono text-[11px]">{comp.position}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommended Action Card */}
                <div className="bg-gradient-to-br from-[#101521] to-[#141A26] border border-[#5B8CFF]/30 rounded-xl p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#5B8CFF]/20 text-[#5B8CFF] font-semibold flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Recommended Action
                    </span>
                    <span className="text-[10px] text-[#29C78F] font-semibold font-mono">+Rank #1 Opportunity</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#F5F7FA]">
                    {currentReport.recommendation.title}
                  </h4>
                  <p className="text-xs text-[#9AA4B2] leading-relaxed">
                    {currentReport.recommendation.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Banner */}
          <div className="px-6 py-4 bg-[#101521] border-t border-[#252D3A] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-[#9AA4B2] text-center sm:text-left">
              Want to see your own brand&apos;s real AI search visibility report?
            </span>
            <a
              href="#hero-scan"
              onClick={() => trackClientEvent(EVENTS.LANDING_CTA_CLICKED, { cta: "sample_report_run_scan" })}
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-primary/20"
              )}
            >
              <span>Run My Free AI Visibility Scan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
