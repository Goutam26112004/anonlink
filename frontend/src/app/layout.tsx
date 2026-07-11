import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import ThemeProvider from "../components/ThemeProvider";
import Toaster from "../components/Toaster";
import { PageTransition } from "../components/PageTransition";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const displayFont = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AnonLink — Anonymous Chat. Real Connections.",
  description:
    "Chat anonymously with real people from around the world. Instant text, voice & video. No trackers, no ads, no pressure — just genuine human connection.",
  keywords: [
    "anonymous chat",
    "random chat",
    "video chat",
    "voice chat",
    "stranger chat",
    "online friends",
    "anonlink",
  ],
  openGraph: {
    title: "AnonLink — Anonymous Chat. Real Connections.",
    description:
      "Chat anonymously with real people from around the world. Free text, voice & video. No trackers, no ads, no pressure.",
    type: "website",
    siteName: "AnonLink",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} h-full antialiased`}
      data-theme="dark"
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#08080F" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#FAFAF9" media="(prefers-color-scheme: light)" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Toaster />
          <PageTransition>{children}</PageTransition>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
