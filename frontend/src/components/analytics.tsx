"use client";

const AW_ID = "AW-17588553167";

// Track custom events (call from components)
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== "undefined" && "gtag" in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
}

// Google Ads conversion labels
const CONV_LABEL_SIGNUP = "QphICPjPt5scEM-L8MJB";
const CONV_LABEL_PURCHASE = "VeAGCN3TjYwcEM-L8MJB";

// Track Google Ads conversions
export function trackConversion(conversionLabel: string, value?: number, transactionId?: string) {
  if (typeof window !== "undefined" && "gtag" in window && conversionLabel) {
    const gtagFn = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
    const params: Record<string, unknown> = {
      send_to: `${AW_ID}/${conversionLabel}`,
      value,
      currency: "JPY",
    };
    if (transactionId) {
      params.transaction_id = transactionId;
    }
    gtagFn("event", "conversion", params);
  }
}

// Track signup conversion (Google Ads + GA4)
export function trackSignup(method: string) {
  trackEvent("sign_up", "auth", method);
  trackConversion(CONV_LABEL_SIGNUP);
}

// Track purchase conversion (Google Ads + GA4)
export function trackPurchase(plan: string, value: number, transactionId?: string) {
  trackEvent("purchase", "billing", plan, value);
  trackConversion(CONV_LABEL_PURCHASE, value, transactionId || `${plan}_${Date.now()}`);
}

// Track begin checkout (GA4)
export function trackBeginCheckout(plan: string, value: number) {
  trackEvent("begin_checkout", "billing", plan, value);
}

// Pre-defined conversion events
export const CONVERSIONS = {
  SIGN_UP: "sign_up",
  START_GENERATE: "start_generate",
  FIRST_GENERATION: "first_generation",
  PURCHASE: "purchase",
  BEGIN_CHECKOUT: "begin_checkout",
} as const;
