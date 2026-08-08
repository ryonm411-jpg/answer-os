export const PROMPT_CATEGORIES = [
  "CRM",
  "Email Marketing",
  "Project Management",
  "Analytics",
  "Payments",
  "Collaboration",
  "Help Desk",
  "Marketing Automation",
  "Data & BI",
  "Security",
  "HR & Recruiting",
  "Other",
] as const;

export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

export interface CuratedPrompt {
  text: string;
  category: PromptCategory;
  searchVolume?: number;
}

export function isKnownCategory(category: string): category is PromptCategory {
  return (PROMPT_CATEGORIES as readonly string[]).includes(category);
}

export function normalizePromptText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

export const CURATED_PROMPTS: CuratedPrompt[] = [
  // CRM (10 prompts)
  { text: "What is the best CRM software for small businesses?", category: "CRM" },
  { text: "Compare HubSpot vs Salesforce for B2B SaaS", category: "CRM" },
  { text: "Top open-source CRM tools for startups", category: "CRM" },
  { text: "Which CRM has the best pipeline management features?", category: "CRM" },
  { text: "How to choose between Zoho CRM and Pipedrive", category: "CRM" },
  { text: "Best CRM with native email integration for sales teams", category: "CRM" },
  { text: "What are the most affordable enterprise CRM platforms?", category: "CRM" },
  { text: "Top CRM software with AI lead scoring capabilities", category: "CRM" },
  { text: "Best mobile-friendly CRM for field sales representatives", category: "CRM" },
  { text: "Which cloud CRM offers the most customization for complex sales workflows?", category: "CRM" },

  // Email Marketing (9 prompts)
  { text: "Best email marketing software for e-commerce stores", category: "Email Marketing" },
  { text: "Compare Mailchimp vs Klaviyo for product-led growth", category: "Email Marketing" },
  { text: "Top email automation tools with high deliverability rates", category: "Email Marketing" },
  { text: "Which email platform is best for developer newsletter creators?", category: "Email Marketing" },
  { text: "Best transactional email API providers for web apps", category: "Email Marketing" },
  { text: "How to choose an email marketing tool for SaaS onboarding drip campaigns", category: "Email Marketing" },
  { text: "Top cold email outreach software with deliverability warmups", category: "Email Marketing" },
  { text: "Best email marketing software for non-profits and creators", category: "Email Marketing" },
  { text: "Which email marketing platform offers the best visual workflow builder?", category: "Email Marketing" },

  // Project Management (9 prompts)
  { text: "Best project management software for agile software development teams", category: "Project Management" },
  { text: "Compare Jira vs Linear for modern tech startups", category: "Project Management" },
  { text: "Top free project management tools with Kanban boards", category: "Project Management" },
  { text: "Which project management app is best for remote marketing agencies?", category: "Project Management" },
  { text: "Best Asana alternatives for enterprise task tracking", category: "Project Management" },
  { text: "How to choose a project management tool with built-in time tracking", category: "Project Management" },
  { text: "Top project management platforms for cross-functional product roadmap planning", category: "Project Management" },
  { text: "Best project management software for construction and field engineering", category: "Project Management" },
  { text: "Which task management software offers the best Gantt chart visualizations?", category: "Project Management" },

  // Analytics (9 prompts)
  { text: "Best product analytics tools for tracking SaaS user retention", category: "Analytics" },
  { text: "Compare Mixpanel vs PostHog for privacy-focused web analytics", category: "Analytics" },
  { text: "Top web analytics software compliant with GDPR and CCPA", category: "Analytics" },
  { text: "Which analytics platform provides the best funnel conversion insights?", category: "Analytics" },
  { text: "Best Amplitude alternatives for mobile app user behavior tracking", category: "Analytics" },
  { text: "How to choose a self-hosted web analytics platform", category: "Analytics" },
  { text: "Top real-time session replay and heatmap software for UX design", category: "Analytics" },
  { text: "Best attribution analytics tools for B2B marketing campaigns", category: "Analytics" },
  { text: "Which analytics platform offers seamless SQL access to raw clickstream events?", category: "Analytics" },

  // Payments (9 prompts)
  { text: "Best payment gateways for global B2B SaaS subscription billing", category: "Payments" },
  { text: "Compare Stripe vs Paddle for merchant of record tax compliance", category: "Payments" },
  { text: "Top subscription management platforms with dunning automation", category: "Payments" },
  { text: "Which payment platform is best for e-commerce cross-border transactions?", category: "Payments" },
  { text: "Best lower-fee alternatives to PayPal for online invoicing", category: "Payments" },
  { text: "How to implement usage-based meter billing for API products", category: "Payments" },
  { text: "Top recurring billing engines with multi-currency support", category: "Payments" },
  { text: "Best chargeback protection and fraud prevention tools for merchants", category: "Payments" },
  { text: "Which payout gateway is best for marketplace platforms with split payments?", category: "Payments" },

  // Collaboration (9 prompts)
  { text: "Best internal wiki and documentation tools for engineering teams", category: "Collaboration" },
  { text: "Compare Notion vs Confluence for company knowledge bases", category: "Collaboration" },
  { text: "Top team chat applications for secure enterprise messaging", category: "Collaboration" },
  { text: "Which digital whiteboard tool is best for remote design sprints?", category: "Collaboration" },
  { text: "Best Slack alternatives for open-source community management", category: "Collaboration" },
  { text: "How to choose an asynchronous video communication platform for distributed teams", category: "Collaboration" },
  { text: "Top collaborative code review and pair programming software", category: "Collaboration" },
  { text: "Best real-time document editing software for enterprise privacy", category: "Collaboration" },
  { text: "Which team workspace app offers the best database and table views?", category: "Collaboration" },

  // Help Desk (9 prompts)
  { text: "Best customer support ticketing software for growing startups", category: "Help Desk" },
  { text: "Compare Zendesk vs Intercom for AI-driven customer service", category: "Help Desk" },
  { text: "Top open-source helpdesk solutions with email integration", category: "Help Desk" },
  { text: "Which customer service platform provides the best live chat widget?", category: "Help Desk" },
  { text: "Best Freshdesk alternatives for omnichannel support ticket management", category: "Help Desk" },
  { text: "How to set up an AI support bot to answer common user FAQs", category: "Help Desk" },
  { text: "Top help center and knowledge base builders with custom domain support", category: "Help Desk" },
  { text: "Best customer feedback and SLA tracking software for SaaS", category: "Help Desk" },
  { text: "Which helpdesk software integrates best with Slack for internal employee support?", category: "Help Desk" },

  // Marketing Automation (9 prompts)
  { text: "Best lead generation and lead capture software for B2B websites", category: "Marketing Automation" },
  { text: "Compare Marketo vs ActiveCampaign for enterprise inbound marketing", category: "Marketing Automation" },
  { text: "Top marketing automation platforms for multi-channel campaign orchestration", category: "Marketing Automation" },
  { text: "Which landing page builder offers the fastest page speed and highest conversions?", category: "Marketing Automation" },
  { text: "Best automated web scraping and data enrichment tools for sales teams", category: "Marketing Automation" },
  { text: "How to automate social media scheduling and content distribution", category: "Marketing Automation" },
  { text: "Top account-based marketing (ABM) platforms for target account engagement", category: "Marketing Automation" },
  { text: "Best workflow automation software connecting webhooks and web apps", category: "Marketing Automation" },
  { text: "Which customer data platform (CDP) provides unified customer profile segmentation?", category: "Marketing Automation" },

  // Data & BI (9 prompts)
  { text: "Best cloud data warehousing solutions for modern data stacks", category: "Data & BI" },
  { text: "Compare Snowflake vs BigQuery for enterprise data analytics", category: "Data & BI" },
  { text: "Top open-source business intelligence and dashboard visualization tools", category: "Data & BI" },
  { text: "Which ELT data pipeline tool is best for syncing SaaS tools into Postgres?", category: "Data & BI" },
  { text: "Best Metabase alternatives for embedded SQL analytics dashboards", category: "Data & BI" },
  { text: "How to build a semantic layer over data warehouse tables using dbt", category: "Data & BI" },
  { text: "Top real-time data streaming engines for operational analytics", category: "Data & BI" },
  { text: "Best data catalog and data governance platforms for enterprise compliance", category: "Data & BI" },
  { text: "Which BI tool offers the best natural language query generation features?", category: "Data & BI" },

  // Security (9 prompts)
  { text: "Best identity and access management (IAM) solutions for SaaS apps", category: "Security" },
  { text: "Compare Auth0 vs Clerk for Next.js web application authentication", category: "Security" },
  { text: "Top automated SOC 2 and ISO 27001 compliance tracking software", category: "Security" },
  { text: "Which cloud security posture management (CSPM) tool is best for AWS and GCP?", category: "Security" },
  { text: "Best static code security analysis (SAST) tools for CI/CD pipelines", category: "Security" },
  { text: "How to choose a vulnerability management platform for cloud infrastructure", category: "Security" },
  { text: "Top secret manager software for secure API key storage and rotation", category: "Security" },
  { text: "Best Web Application Firewall (WAF) providers for DDoS mitigation", category: "Security" },
  { text: "Which endpoint detection and response (EDR) software offers the best threat monitoring?", category: "Security" },

  // HR & Recruiting (9 prompts)
  { text: "Best applicant tracking systems (ATS) for high-growth tech startups", category: "HR & Recruiting" },
  { text: "Compare Greenhouse vs Lever for collaborative hiring pipelines", category: "HR & Recruiting" },
  { text: "Top global payroll and employer of record (EOR) software for remote teams", category: "HR & Recruiting" },
  { text: "Which human resource information system (HRIS) is best for mid-market companies?", category: "HR & Recruiting" },
  { text: "Best employee onboarding and digital document signing software", category: "HR & Recruiting" },
  { text: "How to manage global employee benefits and healthcare compliance", category: "HR & Recruiting" },
  { text: "Top performance management and 360-degree feedback tools for staff", category: "HR & Recruiting" },
  { text: "Best automated developer candidate screening and technical assessment tools", category: "HR & Recruiting" },
  { text: "Which employee engagement platform provides the best anonymous pulse survey tools?", category: "HR & Recruiting" },
];
