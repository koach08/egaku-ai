"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getConsentState } from "@/components/cookie-consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const AW_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

/**
 * Google Ads tag - always loaded (required for Google Ads verification & conversion tracking).
 * Uses Google Consent Mode v2: ads data collected only after consent.
 */
export function GoogleAdsTag() {
  if (!AW_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${AW_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-ads-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}

          // Consent Mode v2: default denied, update on cookie accept
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied',
          });

          gtag('js', new Date());
          gtag('config', '${AW_ID}');
        `}
      </Script>
    </>
  );
}

/**
 * GA4 + consent update - only after cookie consent accepted.
 */
export function GoogleAnalytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(getConsentState() === "accepted");
  }, []);

  if (!consented) return null;

  return (
    <Script id="gtag-consent-update" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}

        // Update consent - now allow tracking
        gtag('consent', 'update', {
          'ad_storage': 'granted',
          'ad_user_data': 'granted',
          'ad_personalization': 'granted',
          'analytics_storage': 'granted',
        });

        ${GA_ID ? `gtag('config', '${GA_ID}', { page_path: window.location.pathname, anonymize_ip: true });` : ""}
      `}
    </Script>
  );
}

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
const CONV_LABEL_SIGNUP = process.env.NEXT_PUBLIC_GADS_CONV_SIGNUP || "";
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
