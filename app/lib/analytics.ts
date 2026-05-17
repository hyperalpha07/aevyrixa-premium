declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (...args: unknown[]) => void };
  }
}

export type AnalyticsEventName =
  | "ProductView"
  | "AddToCart"
  | "CheckoutStarted"
  | "Purchase";

export type AnalyticsEventPayload = Record<string, unknown>;

export function trackEvent(name: AnalyticsEventName, payload?: AnalyticsEventPayload) {
  if (typeof window === "undefined") return;

  if (window.gtag) {
    window.gtag("event", name, payload ?? {});
  }

  if (window.fbq) {
    const fbMap: Record<AnalyticsEventName, string> = {
      ProductView: "ViewContent",
      AddToCart: "AddToCart",
      CheckoutStarted: "InitiateCheckout",
      Purchase: "Purchase",
    };
    window.fbq("track", fbMap[name], payload ?? {});
  }

  if (window.ttq) {
    const ttMap: Record<AnalyticsEventName, string> = {
      ProductView: "ViewContent",
      AddToCart: "AddToCart",
      CheckoutStarted: "InitiateCheckout",
      Purchase: "CompletePayment",
    };
    window.ttq.track(ttMap[name], payload ?? {});
  }
}
