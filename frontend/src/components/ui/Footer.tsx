"use client";

import Link from "next/link";
import { AnimatedLogo } from "../AnimatedLogo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/subscription" },
      { label: "Safety", href: "/help" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Community Guidelines", href: "/guidelines" },
      { label: "Safety Center", href: "/help" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "GitHub", href: "https://github.com/anomalyco/anonlink" },
      { label: "Twitter", href: "https://twitter.com" },
      { label: "Discord", href: "https://discord.gg" },
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--color-void)" }}>
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 -1px 0px rgba(139, 92, 246, 0.08)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-12">
            {columns.map((col) => (
              <div key={col.title}>
                <h4
                  className="text-xs font-semibold tracking-widest uppercase mb-4"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="flex flex-col items-center text-center gap-4 pt-8"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <AnimatedLogo size={20} showText={false} />
            <p className="text-sm max-w-md" style={{ color: "var(--color-text-secondary)" }}>
              The premium anonymous network. No trackers. No traces. Just
              connection.
            </p>
            <p className="text-xs" style={{ color: "rgba(107, 107, 128, 0.6)" }}>
              &copy; {new Date().getFullYear()} AnonLink. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
