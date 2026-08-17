export type MetaStandardEvent = "PageView" | "ViewContent" | "InitiateCheckout" | "Purchase";

export type MetaEventParameters = {
  content_name?: string;
  content_type?: "product";
  currency?: "BRL";
  transaction_id?: string;
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

export function metaPixelDebug(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[meta-pixel] ${message}`, details ?? {});
  }
}

export function trackMetaEvent(
  event: MetaStandardEvent,
  parameters?: MetaEventParameters,
  eventId?: string,
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    metaPixelDebug("evento aguardando carregamento", { event });
    return false;
  }
  if (eventId) {
    window.fbq("track", event, parameters ?? {}, { eventID: eventId });
  } else if (parameters) {
    window.fbq("track", event, parameters);
  } else {
    window.fbq("track", event);
  }
  metaPixelDebug("evento enviado", {
    event,
    currency: parameters?.currency,
    value: parameters?.value,
    hasEventId: Boolean(eventId),
  });
  return true;
}
