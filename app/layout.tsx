import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Urus FIDC — Matching inteligente de crédito",
  description: "Plataforma para conectar operações financeiras aos FIDCs mais aderentes.",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
