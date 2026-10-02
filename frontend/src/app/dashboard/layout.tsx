import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — AnonLink",
  description: "Your AnonLink dashboard. Start a random chat, check your friends, notifications, and more.",
  openGraph: {
    title: "Dashboard — AnonLink",
    description: "Your AnonLink dashboard.",
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
