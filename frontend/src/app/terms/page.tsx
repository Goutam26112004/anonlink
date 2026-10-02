"use client";

import { FileText } from "lucide-react";
import { AuthenticatedLayout } from "../../components/AuthenticatedLayout";

export default function TermsOfService() {

  const sectionClass = "mb-8";
  const headingClass = "text-lg font-bold text-[var(--color-text-primary)] mb-3";
  const textClass = "text-sm text-[var(--color-text-secondary)] leading-relaxed";

  return (
    <AuthenticatedLayout><div className="flex-1 flex flex-col overflow-hidden">
      <header className="app-header shrink-0 z-30 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between px-4 sm:px-6 pl-[4.5rem] lg:pl-4" style={{ minHeight: '64px', paddingTop: '14px', paddingBottom: '14px' }}>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Terms of Service</h1>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-signal-violet)]/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[var(--color-signal-violet)]" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-[var(--color-text-primary)]">
                Terms of Service
              </h1>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Last updated: July 2026
              </p>
            </div>
          </div>

          <div className="h-px bg-[var(--color-border)] mb-6" />

          <div className={sectionClass}>
            <p className={textClass}>
              These Terms of Service govern your access to and use of AnonLink. By accessing our website and using our matching services, you agree to be bound by these terms.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={headingClass}>1. Acceptance of Terms</h2>
            <p className={textClass}>
              By accessing or using the AnonLink website, you agree to comply with and be bound by these Terms of Service. Because AnonLink does not require account creation, your continued use of the website and participation in voice, video, or text chats constitutes your legal acceptance of these Terms.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={headingClass}>2. Eligibility</h2>
            <p className={textClass}>
              AnonLink is strictly for users who are 18 years of age or older. By using the service, you represent and warrant that you are at least 18. While we do not have accounts to attach age verification to, any user suspected of being underage will be permanently removed and restricted from the network.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={headingClass}>3. Acceptable Use</h2>
            <p className={textClass}>
              While AnonLink provides an anonymous environment, &ldquo;anonymous&rdquo; does not mean unaccountable. You agree to use the service for lawful purposes only. Prohibited behaviors include, but are not limited to: harassment, threats, sharing illegal content, spamming, and impersonation. Violations of these rules, if reported via our moderation tools, will result in immediate termination of your current session and permanent restriction from accessing the AnonLink network.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={headingClass}>4. User Accounts &amp; Access</h2>
            <p className={textClass}>
              AnonLink operates without user accounts. You do not need to create a profile, and there is no login process. However, we reserve the right to suspend or permanently block your device or network access at our sole discretion if our real-time moderation system detects repeated violations of these Terms based on user reports.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={headingClass}>5. Intellectual Property</h2>
            <p className={textClass}>
              All rights, title, and interest in and to the AnonLink service (including the website, codebase, algorithms, and branding) are and will remain the exclusive property of AnonLink. Because conversations are ephemeral and not stored, you do not grant AnonLink any permanent license to user-generated content, nor do we host persistent content that would require standard DMCA takedown procedures.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={headingClass}>6. Limitation of Liability</h2>
            <p className={textClass}>
              AnonLink provides the service on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without any warranties. To the maximum extent permitted by law, AnonLink and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service. We do not monitor live, end-to-end encrypted conversations and are not responsible for the conduct of any user you may be matched with.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={headingClass}>7. Termination</h2>
            <p className={textClass}>
              You may terminate this agreement at any time simply by disconnecting from your session and leaving the website. AnonLink reserves the right to terminate or restrict your access to the service at any time, without notice or liability, for conduct that violates these Terms of Service or is otherwise harmful to the AnonLink community.
            </p>
          </div>

          <div className={sectionClass}>
            <h2 className={headingClass}>8. Changes to Terms</h2>
            <p className={textClass}>
              We may modify these Terms of Service at any time. Any changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. Your continued use of AnonLink after any such changes constitutes your acceptance of the new Terms.
            </p>
          </div>
        </div>
      </main>
    </div></div></AuthenticatedLayout>
  );
}
