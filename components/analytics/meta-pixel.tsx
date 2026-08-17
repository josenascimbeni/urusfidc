"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { isMetaPixelId, trackMetaEvent } from "@/lib/analytics/meta-pixel";

const PRODUCT_PARAMETERS = {
  content_name: "Urus 100",
  content_type: "product",
} as const;

function MetaRouteEvents() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    trackMetaEvent("PageView");
    if (pathname === "/") trackMetaEvent("ViewContent", PRODUCT_PARAMETERS);
  }, [pathname]);

  return null;
}

export function MetaPixel({ pixelId: rawPixelId }: { pixelId?: string }) {
  const pixelId = rawPixelId?.trim();
  if (!isMetaPixelId(pixelId)) return null;

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', ${JSON.stringify(pixelId)});
          fbq('track', 'PageView');
          if (window.location.pathname === '/') {
            fbq('track', 'ViewContent', ${JSON.stringify(PRODUCT_PARAMETERS)});
          }
        `}
      </Script>
      <noscript
        dangerouslySetInnerHTML={{
          __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" alt="" />`,
        }}
      />
      <MetaRouteEvents />
    </>
  );
}
