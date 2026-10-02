import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In — AnonLink",
  description: "Start anonymous conversations instantly. No email, no sign-up required. Voice, video, and text — zero footprint.",
  openGraph: {
    title: "Sign In — AnonLink",
    description: "Start anonymous conversations instantly. No email, no sign-up required.",
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
