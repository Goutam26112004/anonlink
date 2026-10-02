import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings — AnonLink",
  description: "Manage your AnonLink account settings, privacy, appearance, and security preferences.",
  openGraph: {
    title: "Settings — AnonLink",
    description: "Manage your AnonLink settings.",
  },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
