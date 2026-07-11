"use client";

import { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useChatStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  return <>{children}</>;
}
