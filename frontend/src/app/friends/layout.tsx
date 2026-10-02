import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Friends — AnonLink",
  description: "Manage your AnonLink friends list, send friend requests, and see who's online.",
  openGraph: {
    title: "Friends — AnonLink",
    description: "Manage your AnonLink friends list.",
  },
};

export default function FriendsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
