import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications — AnonLink",
  description: "View your AnonLink notifications including friend requests, chat invites, and updates.",
  openGraph: {
    title: "Notifications — AnonLink",
    description: "View your AnonLink notifications.",
  },
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
