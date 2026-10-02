import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Guidelines — AnonLink",
  description: "AnonLink community guidelines. Our rules for keeping conversations respectful, safe, and welcoming for everyone.",
  openGraph: {
    title: "Community Guidelines — AnonLink",
    description: "Our rules for keeping AnonLink safe and welcoming for everyone.",
  },
};

export default function GuidelinesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
