"use client";

import { useChatStore } from "../../store/chatStore";

/**
 * Animated day/night theme toggle button.
 * Shows a sun/moon with smooth transition animation.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useChatStore((s) => s.theme);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    useChatStore.setState({ theme: next });
  };

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      className={`relative w-14 h-7 rounded-full transition-all duration-500 ease-in-out cursor-pointer overflow-hidden ${
        isDark
          ? "bg-gradient-to-r from-indigo-900 to-slate-800 shadow-[inset_0_1px_4px_rgba(0,0,0,0.4)]"
          : "bg-gradient-to-r from-sky-300 to-blue-400 shadow-[inset_0_1px_4px_rgba(0,0,0,0.1)]"
      } ${className}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Stars (visible in dark mode) */}
      <span
        className={`absolute transition-all duration-500 ${
          isDark ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="absolute top-1.5 left-2 w-1 h-1 rounded-full bg-white/70" />
        <span className="absolute top-3.5 left-4 w-0.5 h-0.5 rounded-full bg-white/50" />
        <span className="absolute top-1 left-5.5 w-0.5 h-0.5 rounded-full bg-white/60" />
      </span>

      {/* Clouds (visible in light mode) */}
      <span
        className={`absolute transition-all duration-500 ${
          isDark ? "opacity-0 translate-x-2" : "opacity-100 translate-x-0"
        }`}
      >
        <span className="absolute top-3.5 right-2.5 w-3 h-1.5 rounded-full bg-white/60" />
        <span className="absolute top-2 right-4 w-2.5 h-1.5 rounded-full bg-white/40" />
      </span>

      {/* Sun/Moon circle */}
      <span
        className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-500 ease-in-out transform ${
          isDark
            ? "left-1 bg-gradient-to-br from-gray-200 to-gray-400 shadow-[0_0_6px_rgba(200,200,200,0.4)]"
            : "left-8 bg-gradient-to-br from-yellow-300 to-orange-400 shadow-[0_0_10px_rgba(250,200,50,0.5)]"
        }`}
      >
        {/* Moon craters (dark mode) */}
        {isDark && (
          <>
            <span className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-gray-400/40" />
            <span className="absolute top-2.5 left-0.5 w-1 h-1 rounded-full bg-gray-400/30" />
          </>
        )}
        {/* Sun rays (light mode) */}
        {!isDark && (
          <span className="absolute inset-[-2px] rounded-full animate-pulse bg-yellow-300/20" />
        )}
      </span>
    </button>
  );
}
