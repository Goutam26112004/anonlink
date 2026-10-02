"use client";

import { BookOpen, ExternalLink } from "lucide-react";
import { AuthenticatedLayout } from "../../components/AuthenticatedLayout";

const guidelines = [
  {
    num: "1",
    title: "No Harassment or Hate Speech",
    desc: "Treat everyone with respect. Slurs, threats, bullying, and hate speech based on race, gender, sexuality, religion, or disability will lead to immediate restrictions.",
  },
  {
    num: "2",
    title: "No Scams or Malicious Links",
    desc: "Do not share invite links, credit card information, or redirect users to malicious URLs. Any attempt to defraud other users will result in a permanent ban.",
  },
  {
    num: "3",
    title: "Report Infractions",
    desc: "If another user behaves inappropriately, use the flag icon in the chat header to submit a report. Reports are anonymous and reviewed within 24 hours.",
  },
  {
    num: "4",
    title: "Protect Your Privacy",
    desc: "Never share personal information such as your phone number, address, full name, or social media handles. We will never ask you for this information.",
  },
  {
    num: "5",
    title: "No Underage Users",
    desc: "You must be 18 or older to use AnonLink. If you encounter someone who appears to be underage, report them immediately using the flag icon.",
  },
  {
    num: "6",
    title: "No Illegal Activity",
    desc: "Do not use AnonLink for any illegal purpose. This includes but is not limited to solicitation, fraud, drug transactions, and sharing illegal content.",
  },
];

export default function CommunityGuidelines() {

  return (
    <AuthenticatedLayout><div className="flex-1 flex flex-col overflow-hidden">
      <header className="app-header shrink-0 z-30 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between px-4 sm:px-6 pl-[4.5rem] lg:pl-4" style={{ minHeight: '64px', paddingTop: '14px', paddingBottom: '14px' }}>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
              Community Guidelines
            </h1>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-signal-violet)]/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[var(--color-signal-violet)]" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-[var(--color-text-primary)]">
                Community Guidelines
              </h1>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Last updated: July 2026
              </p>
            </div>
          </div>

          <div className="h-px bg-[var(--color-border)] mb-6" />

          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-8">
            AnonLink is built on trust and respect. These guidelines help keep the
            network safe for everyone. Violations may result in warnings,
            temporary restrictions, or permanent bans depending on severity and
            frequency.
          </p>

          <div className="space-y-4">
            {guidelines.map((item) => (
              <div key={item.num} className="flex gap-4 p-4 rounded-xl bg-[var(--color-surface-2)]">
                <span className="w-8 h-8 rounded-lg bg-[var(--color-signal-violet)]/10 flex items-center justify-center text-[var(--color-signal-violet)] text-sm font-bold shrink-0">
                  {item.num}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-[var(--color-border)]/30">
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              For more information about how reporting works, what happens after
              a report, and how to stay safe, visit the{" "}
              <a
                href="/help"
                className="text-[var(--color-signal-violet)] underline underline-offset-2 inline-flex items-center gap-0.5"
              >
                Safety Center <ExternalLink className="w-3 h-3" />
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div></div></AuthenticatedLayout>
  );
}
