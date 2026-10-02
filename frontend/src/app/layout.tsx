import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Toaster } from "../components/ui/Toast";
import { SocketProvider } from "../components/SocketProvider";
import { ThemeProvider } from "../components/ThemeProvider";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AnonLink — Anonymous Chat, Voice & Video | Talk to Strangers Privately",
    template: "%s | AnonLink",
  },
  description:
    "AnonLink is the #1 anonymous chat platform for private text, voice, and video conversations with strangers. No sign-up required. End-to-end encrypted. Connect instantly with people worldwide.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    interactiveWidget: "resizes-content",
  },
  keywords: [
    "anonymous chat",
    "talk to strangers",
    "random chat",
    "anonymous video chat",
    "anonymous voice chat",
    "private chat online",
    "chat with strangers",
    "omegle alternative",
    "random video call",
    "encrypted chat",
    "no sign up chat",
    "free anonymous chat",
    "online chat rooms",
    "stranger chat app",
    "private messaging",
    "secure communication",
    "anonymous messaging",
    "random stranger chat",
    "voice chat online",
    "video chat strangers",
    "chat without registration",
    "anonlink",
    "anon chat",
    "private video call",
    "end to end encrypted chat",
  ],
  authors: [{ name: "AnonLink" }],
  creator: "AnonLink",
  publisher: "AnonLink",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://anonlink.online",
  },
  openGraph: {
    title: "AnonLink — Anonymous Chat, Voice & Video | Talk to Strangers",
    description:
      "Connect instantly with strangers worldwide through private text, voice, and video chat. No sign-up. No trackers. No logs. 100% anonymous.",
    type: "website",
    siteName: "AnonLink",
    url: "https://anonlink.online",
    locale: "en_US",
    images: [
      {
        url: "https://anonlink.online/og-image.png",
        width: 1200,
        height: 630,
        alt: "AnonLink - Anonymous Chat Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AnonLink — Anonymous Chat with Strangers",
    description: "Private text, voice & video chat with strangers. No sign-up. End-to-end encrypted.",
    images: ["https://anonlink.online/og-image.png"],
  },
  verification: {
    google: "google-site-verification-code-here",
  },
  category: "communication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8B5CF6" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link
          rel="preload"
          href="/fonts/CabinetGrotesk-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/CabinetGrotesk-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/CabinetGrotesk-Extrabold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/GeneralSans-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/GeneralSans-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/GeneralSans-Semibold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/GeneralSans-Bold.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[var(--color-signal-violet)] focus:text-white focus:text-sm focus:font-bold focus:outline-none"
        >
          Skip to content
        </a>
        <Toaster />
        <ThemeProvider />
        <SocketProvider>
          <div id="main-content">{children}</div>
        </SocketProvider>
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
