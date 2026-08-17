export type MetaStandardEvent = "PageView" | "ViewContent" | "InitiateCheckout" | "Purchase";

export type MetaEventParameters = {
  content_name?: string;
  content_type?: "product";
  currency?: "BRL";
  value?: number;
};

type MetaPixelFunction = (...args: unknown[]) => void;

declare global {
  interface Window {
    _fbq?: MetaPixelFunction;
    fbq?: MetaPixelFunction;
  }
}

export function isMetaPixelId(value: string | undefined): value is string {
  return /^\d{5,30}$/.test(value?.trim() ?? "");
}

export function trackMetaEvent(
  event: MetaStandardEvent,
  parameters?: MetaEventParameters,
  eventId?: string,
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return false;
  if (eventId) {
    window.fbq("track", event, parameters ?? {}, { eventID: eventId });
  } else if (parameters) {
    window.fbq("track", event, parameters);
  } else {
    window.fbq("track", event);
  }
  return true;
}
