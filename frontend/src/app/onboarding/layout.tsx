import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set Up Your Profile — AnonLink",
  description: "Tell us a bit about yourself to get the best matching experience on AnonLink.",
  openGraph: {
    title: "Set Up Your Profile — AnonLink",
    description: "Get the best matching experience on AnonLink.",
  },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
