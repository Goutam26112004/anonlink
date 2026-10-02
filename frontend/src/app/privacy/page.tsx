"use client";

import { Shield } from "lucide-react";
import { AuthenticatedLayout } from "../../components/AuthenticatedLayout";

export default function PrivacyPolicy() {

  const sectionClass = "mb-8";
  const headingClass = "text-lg font-bold text-[var(--color-text-primary)] mb-3";
  const textClass = "text-sm text-[var(--color-text-secondary)] leading-relaxed";

  return (
    <AuthenticatedLayout><div className="flex-1 flex flex-col overflow-hidden">
      <header className="app-header shrink-0 z-30 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between px-4 sm:px-6 pl-[4.5rem] lg:pl-4" style={{ minHeight: '64px', paddingTop: '14px', paddingBottom: '14px' }}>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Privacy Policy</h1>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-signal-violet)]/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[var(--color-signal-violet)]" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-[var(--color-text-primary)]">
                Privacy Policy
              </h1>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Last updated: July 2026
              </p>
            </div>
          </div>

          <div className="h-px bg-[var(--color-border)] mb-6" />

          <div className={sectionClass}>
            <p className={textClass}>
              This Privacy Policy outlines how AnonLink handles data. Our core philosophy is &ldquo;Zero Footprint&rdquo;&mdash;we believe in real connection without compromise. Because of this, our data collection practices are minimal by design.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={headingClass}>1. Information We Collect</h2>
            <p className={textClass}>
              AnonLink operates on a strict &ldquo;Zero Footprint&rdquo; model. We do not require sign-ups, and we do not collect personal account information such as emails, display names, or phone numbers. We do not log IP addresses, store chat transcripts, or record call metadata. We do not use trackers, and we do not plant tracking cookies on your device. The only data processed is the temporary, ephemeral connection data required to facilitate live WebRTC matching and encrypted communication, which is immediately discarded.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={headingClass}>2. How We Use Your Information</h2>
            <p className={`${textClass} mb-3`}>
              Because we collect no persistent personal data, the ephemeral data processed during your visit is used strictly for two purposes:
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)] leading-relaxed list-none">
              <li className="flex gap-2">
                <span className="text-[var(--color-signal-violet)] font-bold shrink-0">&bull;</span>
                <span><strong className="text-[var(--color-text-primary)]">Providing the Service:</strong> To instantly match you with other users and establish a secure WebRTC connection for voice, video, or text chat.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--color-signal-violet)] font-bold shrink-0">&bull;</span>
                <span><strong className="text-[var(--color-text-primary)]">Trust &amp; Safety:</strong> If a user is reported through our &ldquo;One-tap Report &amp; Block&rdquo; feature, limited, temporary session data associated with the report may be reviewed by our moderation system to enforce our community guidelines and restrict network access for violators.</span>
              </li>
            </ul>
          </div>

          <div className={sectionClass}>
            <h2 className={headingClass}>3. Data Sharing &amp; Disclosure</h2>
            <p className={textClass}>
              We cannot sell, share, or disclose what we do not have. Because we do not log user data, track IPs, or store chat histories, there is no personal data to share with third-party marketers, service providers, or data brokers. We will comply with legal obligations and law enforcement requests to the extent required by law, but our system is fundamentally designed to hold zero historical user records.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={headingClass}>4. Data Retention &amp; Deletion</h2>
            <p className={textClass}>
              AnonLink does not retain your data. All conversations are strictly ephemeral. The moment you disconnect or skip to a new user, your session ceases to exist and leaves zero trace. Because we do not have user accounts or store personal data, there is no need for you to submit a data deletion request&mdash;your footprint is automatically erased the moment you leave the site.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={headingClass}>5. Your Rights</h2>
            <p className={textClass}>
              Under applicable privacy laws (such as GDPR or CCPA), users typically have the right to access, correct, delete, or port their personal data. Because AnonLink collects no identifiable personal data and stores no historical records, these rights are inherently fulfilled by our system&rsquo;s architecture.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={headingClass}>6. Security</h2>
            <p className={textClass}>
              All voice and video calls on AnonLink are secured with end-to-end encryption. Because your identity never leaves your device and we maintain zero logs on our servers, the risk of data breaches exposing your chat history or identity is virtually eliminated.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={headingClass}>7. Contact</h2>
            <p className={textClass}>
              If you have any questions about this Privacy Policy or our data practices, please contact us at <a href="mailto:privacy@anonlink.online" className="text-[var(--color-signal-violet)] hover:underline">privacy@anonlink.online</a>.
            </p>
          </div>
        </div>
      </main>
    </div></div></AuthenticatedLayout>
  );
}
