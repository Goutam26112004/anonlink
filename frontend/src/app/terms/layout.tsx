import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — AnonLink",
  description: "AnonLink terms of service. By using AnonLink, you agree to these terms.",
  openGraph: {
    title: "Terms of Service — AnonLink",
    description: "AnonLink terms of service.",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
