export const EVENTS = {
  // Auth & Onboarding
  USER_SIGNED_UP: "user_signed_up",
  USER_SIGNED_IN: "user_signed_in",
  ONBOARDING_COMPLETED: "onboarding_completed",
  DOMAIN_ADDED: "domain_added",
  DOMAIN_UPDATED: "domain_updated",
  DOMAIN_REMOVED: "domain_removed",

  // Scans
  SCAN_INITIATED: "scan_initiated",
  SCAN_COMPLETED: "scan_completed",
  SCAN_FAILED: "scan_failed",

  // Prompts
  PROMPT_GENERATED: "prompt_generated",
  PROMPT_ADDED: "prompt_added",
  PROMPT_UPDATED: "prompt_updated",
  PROMPT_ARCHIVED: "prompt_archived",

  // Billing
  CHECKOUT_INITIATED: "checkout_initiated",
  SUBSCRIPTION_ACTIVATED: "subscription_activated",
  PLAN_UPGRADED: "plan_upgraded",

  // Feature Usage
  DASHBOARD_VIEWED: "dashboard_visited",
  MODELS_TAB_OPENED: "models_tab_opened",
  EXPORT_CSV: "export_csv",

  // Errors (client-side)
  CLIENT_ERROR: "client_error",
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];
