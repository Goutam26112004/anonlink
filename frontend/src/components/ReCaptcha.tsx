'use client';

import { useEffect, useRef, useState } from 'react';

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  action?: string;
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export default function ReCaptcha({ onVerify, onExpire, action }: ReCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const renderCaptcha = () => {
      if (!containerRef.current || !(window as any).grecaptcha) return;
      try {
        widgetIdRef.current = (window as any).grecaptcha.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => {
            onVerify(token);
          },
          'expired-callback': () => {
            if (onExpire) onExpire();
          }
        });
        setLoaded(true);
      } catch (e) {
        console.error('reCAPTCHA render error:', e);
      }
    };

    if ((window as any).grecaptcha) {
      renderCaptcha();
    } else {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=explicit`;
      script.async = true;
      script.defer = true;
      script.onload = renderCaptcha;
      document.head.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current !== null && (window as any).grecaptcha) {
        try {
          (window as any).grecaptcha.reset(widgetIdRef.current);
        } catch (e) { /* ignore */ }
      }
    };
  }, [onVerify, onExpire]);

  const reset = () => {
    if (widgetIdRef.current !== null && (window as any).grecaptcha) {
      (window as any).grecaptcha.reset(widgetIdRef.current);
    }
  };

  return (
    <div className="flex justify-center my-4">
      <div ref={containerRef}></div>
      {!loaded && (
        <div className="text-xs text-slate-500 italic">Loading CAPTCHA...</div>
      )}
    </div>
  );
}
