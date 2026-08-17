import type { Metadata } from "next";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Urus FIDC — Matching inteligente de crédito",
  description: "Plataforma para conectar operações financeiras aos FIDCs mais aderentes.",
  icons: {
    icon: { url: "/brand/urus-fidc-logo.png", type: "image/png" },
  },
  openGraph: {
    title: "Urus FIDC — Matching inteligente de crédito",
    description: "O matching inteligente entre empresas e FIDCs.",
    images: [{ url: "/og.png", width: 1792, height: 938, alt: "Urus FIDC — matching entre empresas e FIDCs" }],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Urus FIDC — Matching inteligente de crédito",
    description: "O matching inteligente entre empresas e FIDCs.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
        <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
      </body>
    </html>
  );
}
