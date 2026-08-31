import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider, AppShell } from "@/components/ThemeProvider";
import { LiveSyncProvider } from "@/context/LiveSyncContext";
import { SettingsProvider } from "@/context/SettingsContext";

export const metadata: Metadata = {
  metadataBase: new URL('https://bigambitionscompanion.vercel.app'),
  title: {
    default: "Big Ambitions Companion",
    template: "%s | Big Ambitions Companion"
  },
  description: "Comprehensive business companion and real-time telemetry toolkit for Big Ambitions. Features dynamic pricing calculators, factory production pipelines, full database catalog, and live game telemetry sync.",
  keywords: [
    "Big Ambitions",
    "Big Ambitions Companion",
    "Big Ambitions Calculator",
    "Big Ambitions Guide",
    "Big Ambitions Pricing",
    "Big Ambitions Mod",
    "Live HQ",
    "Factory Planner"
  ],
  authors: [{ name: "Big Ambitions Companion" }],
  creator: "Big Ambitions Companion",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bigambitionscompanion.vercel.app",
    siteName: "Big Ambitions Companion",
    title: "Big Ambitions Companion — Compendium Suite & Live HQ",
    description: "Interactive tools, dynamic profit calculators, factory production optimizer, and real-time telemetry mod sync for Big Ambitions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Big Ambitions Companion — Compendium Suite & Live HQ",
    description: "Interactive tools, dynamic profit calculators, factory production optimizer, and real-time telemetry mod sync for Big Ambitions.",
  },
  icons: {
    icon: "/icon",
    apple: "/icon"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ba_theme');if(t==='dark'||t==='light'){document.documentElement.classList.toggle('dark',t==='dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] flex">
        <ThemeProvider>
          <SettingsProvider>
            <LiveSyncProvider>
              <AppShell>
                {children}
              </AppShell>
            </LiveSyncProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
