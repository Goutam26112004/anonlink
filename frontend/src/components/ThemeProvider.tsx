"use client";

import { useEffect } from "react";
import { useChatStore } from "../store/chatStore";

/**
 * Applies the theme from the store to the HTML element's data-theme attribute.
 * Also persists theme to localStorage for instant application on page load.
 */
export function ThemeProvider() {
  const theme = useChatStore((s) => s.theme);

  useEffect(() => {
    // Apply to DOM
    document.documentElement.setAttribute("data-theme", theme);
    // Persist for next load
    localStorage.setItem("anonlink-theme", theme);
  }, [theme]);

  // On mount, apply saved theme immediately (before store hydrates from API)
  useEffect(() => {
    const saved = localStorage.getItem("anonlink-theme") as "dark" | "light" | null;
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
      useChatStore.setState({ theme: saved });
    }
  }, []);

  return null;
}
