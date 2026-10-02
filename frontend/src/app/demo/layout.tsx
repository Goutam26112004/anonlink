import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo — AnonLink",
  description: "Try the AnonLink demo experience. See how anonymous matching works with a simulated conversation.",
  openGraph: {
    title: "Demo — AnonLink",
    description: "Try the AnonLink demo.",
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
