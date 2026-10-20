import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kurup — Every dirham, accounted for",
  description:
    "A calm, fast expense tracker for cards, cash, budgets and the months ahead.",
};

export const viewport: Viewport = {
  themeColor: "#f7f7fa",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${spaceGrotesk.variable} h-full antialiased`}
      // Browser extensions (for example CRX Launcher) can inject attributes
      // into <html> before React hydrates. Ignore only this element's attributes.
      suppressHydrationWarning
    >
      <body className="min-h-full bg-canvas text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
