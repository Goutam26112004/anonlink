"use client";

import { Ban, CreditCard, AlertTriangle, HelpCircle, Mail } from "lucide-react";
import { AuthenticatedLayout } from "../../components/AuthenticatedLayout";

export default function RefundPolicy() {

  const sectionClass = "mb-8";
  const headingClass = "text-lg font-bold text-[var(--color-text-primary)] mb-3";
  const subHeadingClass = "text-sm font-semibold text-[var(--color-text-primary)] mb-2";
  const textClass = "text-sm text-[var(--color-text-secondary)] leading-relaxed";
  const listClass = "text-sm text-[var(--color-text-secondary)] leading-relaxed list-disc pl-5 space-y-1.5";
  const highlightBox = "p-4 rounded-xl bg-red-500/5 border border-red-500/20 mb-4";

  return (
    <AuthenticatedLayout><div className="flex-1 flex flex-col overflow-hidden">
      <header className="app-header shrink-0 z-30 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between px-4 sm:px-6 pl-[4.5rem] lg:pl-4" style={{ minHeight: '64px', paddingTop: '14px', paddingBottom: '14px' }}>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Refund Policy</h1>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-[var(--color-text-primary)]">
                Refund &amp; Cancellation Policy
              </h1>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Last updated: July 2026
              </p>
            </div>
          </div>

          <div className="h-px bg-[var(--color-border)] mb-6" />

          {/* Key Notice */}
          <div className={highlightBox}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-400 mb-1">Important Notice</p>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  All services provided by AnonLink are <strong className="text-[var(--color-text-primary)]">non-refundable</strong>. 
                  By purchasing any subscription plan or premium feature, you acknowledge and agree that all payments are final 
                  and no refunds will be issued under any circumstances.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <div className={sectionClass}>
            <h2 className={headingClass}>1. General Policy</h2>
            <p className={textClass}>
              AnonLink operates on a strict no-refund policy for all paid services, subscriptions, and premium features. 
              Once a transaction is completed, it is considered final and irreversible. This policy applies to all payment 
              methods including but not limited to credit cards, debit cards, UPI, net banking, and any third-party payment 
              processors.
            </p>
          </div>

          {/* Section 2 */}
          <div className={sectionClass}>
            <h2 className={headingClass}>2. Subscription Plans</h2>
            <p className={textClass + " mb-3"}>
              The following terms apply to all subscription purchases:
            </p>
            <ul className={listClass}>
              <li>All subscription fees (Daily, Weekly, Monthly, or Annual plans) are non-refundable once charged.</li>
              <li>Subscription payments are charged upfront for the selected billing period.</li>
              <li>If you cancel your subscription, you will continue to have access to premium features until the end of your current billing period. No partial or prorated refunds will be provided.</li>
              <li>Unused portions of a subscription period are not eligible for refund or credit.</li>
              <li>Automatic renewal charges are non-refundable. It is your responsibility to cancel before the renewal date if you do not wish to continue.</li>
              <li>Downgrading from a higher-tier plan to a lower-tier plan does not entitle you to a refund of the price difference.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className={sectionClass}>
            <h2 className={headingClass}>3. Premium Features</h2>
            <p className={textClass + " mb-3"}>
              Premium features included in subscription plans are non-refundable:
            </p>
            <ul className={listClass}>
              <li><strong className="text-[var(--color-text-primary)]">Voice &amp; Video Calling</strong> — Access to voice and video call features with friends. Non-refundable regardless of usage or technical limitations of your device/network.</li>
              <li><strong className="text-[var(--color-text-primary)]">Gender Filter</strong> — Ability to filter chat matches by gender preference. Non-refundable even if no matches are found with your preference.</li>
              <li><strong className="text-[var(--color-text-primary)]">Priority Matching</strong> — Enhanced matchmaking priority in the queue. Non-refundable regardless of match quality or wait times.</li>
              <li><strong className="text-[var(--color-text-primary)]">Extended Media Sharing</strong> — Enhanced image and media sharing capabilities. Non-refundable once subscription is active.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className={sectionClass}>
            <h2 className={headingClass}>4. Circumstances Where Refunds Are NOT Provided</h2>
            <p className={textClass + " mb-3"}>
              To be explicit, refunds will not be issued in any of the following situations:
            </p>
            <ul className={listClass}>
              <li>You change your mind after purchasing a subscription.</li>
              <li>You are unable to find a chat match or experience long wait times.</li>
              <li>You experience technical difficulties due to your device, browser, or internet connection.</li>
              <li>Your account is suspended or terminated due to violation of our Terms of Service, Community Guidelines, or any applicable policies.</li>
              <li>You forget to cancel your subscription before the renewal date.</li>
              <li>You do not use the premium features during your subscription period.</li>
              <li>A premium feature does not meet your personal expectations.</li>
              <li>Service interruptions due to scheduled maintenance or force majeure events.</li>
              <li>You create multiple accounts and purchase subscriptions on each.</li>
              <li>Changes in pricing or plan structure after your purchase.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className={sectionClass}>
            <h2 className={headingClass}>5. Account Termination</h2>
            <p className={textClass}>
              If your account is banned, suspended, or terminated for violating our Terms of Service, Community Guidelines, 
              or any other platform rules, you will not be entitled to any refund for the remaining subscription period. 
              This includes but is not limited to violations such as harassment, sharing inappropriate content, impersonation, 
              spamming, or any form of abuse on the platform.
            </p>
          </div>

          {/* Section 6 */}
          <div className={sectionClass}>
            <h2 className={headingClass}>6. Free Trial</h2>
            <p className={textClass}>
              If AnonLink offers a free trial period, you will not be charged during the trial. However, if you do not cancel 
              before the trial ends, your subscription will automatically begin and you will be charged the applicable fee. 
              Charges incurred after the trial period ends are non-refundable.
            </p>
          </div>

          {/* Section 7 */}
          <div className={sectionClass}>
            <h2 className={headingClass}>7. Payment Disputes &amp; Chargebacks</h2>
            <p className={textClass}>
              Filing a fraudulent chargeback or payment dispute with your bank or payment provider without a legitimate 
              reason is a violation of our Terms of Service. If you initiate a chargeback, your account will be immediately 
              suspended pending investigation. If the chargeback is found to be illegitimate, your account may be permanently 
              banned and you may be held liable for any associated fees or damages.
            </p>
          </div>

          {/* Section 8 */}
          <div className={sectionClass}>
            <h2 className={headingClass}>8. Cancellation Process</h2>
            <p className={textClass + " mb-3"}>
              While refunds are not available, you may cancel your subscription at any time:
            </p>
            <ul className={listClass}>
              <li>Navigate to <strong className="text-[var(--color-text-primary)]">Settings &gt; Subscription</strong> in the app.</li>
              <li>Click &quot;Cancel Subscription&quot; and confirm your cancellation.</li>
              <li>Your premium access will remain active until the end of the current billing period.</li>
              <li>After cancellation, your account will revert to the free tier with limited features.</li>
              <li>You can resubscribe at any time at the then-current pricing.</li>
            </ul>
          </div>

          {/* Section 9 */}
          <div className={sectionClass}>
            <h2 className={headingClass}>9. Exceptional Circumstances</h2>
            <p className={textClass}>
              In extremely rare cases, AnonLink may, at its sole and absolute discretion, consider providing store credit 
              (not a monetary refund) if a verifiable platform-wide outage lasting more than 72 consecutive hours directly 
              prevents all premium subscribers from accessing any premium features. This is not a guarantee and any such 
              decision is entirely at the discretion of AnonLink management. Users must submit a written request within 7 
              days of the incident.
            </p>
          </div>

          {/* Section 10 */}
          <div className={sectionClass}>
            <h2 className={headingClass}>10. Modifications to This Policy</h2>
            <p className={textClass}>
              AnonLink reserves the right to modify this Refund Policy at any time without prior notice. Changes will be 
              effective immediately upon posting on this page. Your continued use of paid services after any modifications 
              constitutes acceptance of the updated policy. It is your responsibility to review this policy periodically.
            </p>
          </div>

          {/* Contact */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-[var(--color-signal-violet)] shrink-0 mt-0.5" />
              <div>
                <p className={subHeadingClass}>Questions About This Policy?</p>
                <p className={textClass + " mb-2"}>
                  If you have any questions or concerns regarding this refund policy, please contact our support team:
                </p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <a href="mailto:support@anonlink.online" className="text-sm text-[var(--color-signal-violet)] hover:underline">
                    support@anonlink.online
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Agreement */}
          <div className="mt-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              <strong className="text-amber-400">By making any purchase on AnonLink, you confirm that you have read, understood, 
              and agree to this Refund Policy in its entirety.</strong> You acknowledge that all services are non-refundable and 
              that you waive any right to request a refund after completing a transaction.
            </p>
          </div>
        </div>
      </main>
    </div></div></AuthenticatedLayout>
  );
}
