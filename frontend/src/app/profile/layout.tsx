import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile — AnonLink",
  description: "View and edit your AnonLink profile information.",
  openGraph: {
    title: "Profile — AnonLink",
    description: "Your AnonLink profile.",
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
