import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safety Center — AnonLink",
  description: "Learn how to stay safe on AnonLink. Community guidelines, reporting tools, safety tips, and support resources.",
  openGraph: {
    title: "Safety Center — AnonLink",
    description: "Stay safe on AnonLink. Community guidelines, reporting, and support resources.",
  },
};

export default function SafetyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
