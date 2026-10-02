import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — AnonLink",
  description: "AnonLink privacy policy. We do not track you, sell your data, or store your conversations.",
  openGraph: {
    title: "Privacy Policy — AnonLink",
    description: "AnonLink does not track you, sell your data, or store your conversations.",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
