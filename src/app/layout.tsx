import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Northfid | Modern Trading Platform", template: "%s | Northfid" },
  description:
    "Invest in 1000+ assets, copy expert traders, and grow your portfolio with Northfid – trusted by thousands of investors worldwide.",
  keywords: ["trading", "copy trading", "investment", "forex", "crypto", "stocks"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900">
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
