"use client";

/**
 * Message status indicator (WhatsApp-style):
 * - 'sending': clock icon (not yet sent)
 * - 'sent': single tick (delivered to server)
 * - 'seen': double tick (read by recipient)
 */

type Status = 'sending' | 'sent' | 'seen';

interface MessageStatusProps {
  status: Status;
  className?: string;
}

export function MessageStatus({ status, className = "" }: MessageStatusProps) {
  if (status === 'sending') {
    // Clock icon
    return (
      <svg className={`w-[14px] h-[14px] inline-block ${className}`} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 5.5V8.5L10 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (status === 'sent') {
    // Single tick
    return (
      <svg className={`w-[16px] h-[14px] inline-block ${className}`} viewBox="0 0 16 12" fill="none">
        <path d="M2 6.5L6 10.5L14 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Seen - double tick
  return (
    <svg className={`w-[18px] h-[14px] inline-block ${className}`} viewBox="0 0 20 12" fill="none">
      <path d="M1.5 6.5L5.5 10.5L13.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6.5L10 10.5L18 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Maps backend message status to display status.
 * Backend: SENDING, SENT, DELIVERED, SEEN
 * Display: sending (clock), sent (single tick), seen (double tick)
 */
export function mapMessageStatus(backendStatus?: string): Status {
  switch (backendStatus?.toUpperCase()) {
    case 'SENDING': return 'sending';
    case 'SENT': 
    case 'DELIVERED': return 'sent';
    case 'SEEN': 
    case 'READ': return 'seen';
    default: return 'sent';
  }
}
