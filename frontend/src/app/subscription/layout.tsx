import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Subscription — AnonLink",
  description: "AnonLink is free and always will be. No ads, no trackers, no subscriptions.",
  openGraph: {
    title: "Subscription — AnonLink",
    description: "AnonLink is free. No ads, no trackers, no subscriptions.",
  },
};

export default function SubscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
