"use client";

import { useEffect, useRef } from "react";

/**
 * useVisualViewportLock
 * ----------------------
 * Keeps a chat shell (header + messages + footer) pinned exactly to the
 * browser's visual viewport, on mobile, whether or not the on-screen
 * keyboard is open.
 *
 * WHY THIS IS NEEDED
 * Mobile browsers (Chrome/Android in particular) will pan the *visual*
 * viewport upward when a text input inside the page gains focus, to keep
 * the caret comfortably above the keyboard. This happens even when the
 * page itself never scrolls (`overflow: hidden` on html/body) and even
 * with `interactive-widget=resizes-content` set, because the pan is a
 * separate browser behavior from viewport *resizing*. A normal in-flow
 * element (our header) gets carried off the top of the screen by that
 * pan, while elements that are `position: fixed` relative to the layout
 * viewport do NOT get repositioned by it automatically either — so we
 * must actively read `window.visualViewport.offsetTop`/`height` and
 * apply them to a fixed-position element ourselves, every time they
 * change.
 *
 * HOW
 * The target element is expected to be `position: fixed` (see the
 * `.vv-lock` class in globals.css). On every visualViewport `resize` /
 * `scroll` event we set:
 *   - top    = visualViewport.offsetTop   (cancels the upward pan)
 *   - height = visualViewport.height      (shrinks to the space above
 *                                           the keyboard, so the footer
 *                                           lands right above it)
 * This is the same technique used by production chat apps (Telegram
 * Web, Discord) to keep a chat shell glued to the visible area.
 */
export function useVisualViewportLock(ref: React.RefObject<HTMLElement | null>) {
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    const el = ref.current;
    if (!vv || !el) return;

    const apply = () => {
      if (!el) return;
      el.style.top = `${vv.offsetTop}px`;
      el.style.left = `${vv.offsetLeft}px`;
      el.style.width = `${vv.width}px`;
      el.style.height = `${vv.height}px`;
    };

    const schedule = () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(apply);
    };

    // Apply immediately and on every viewport change (keyboard open/close,
    // browser UI show/hide, orientation change, and the focus-pan itself).
    apply();
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
    window.addEventListener("orientationchange", schedule);

    return () => {
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
      window.removeEventListener("orientationchange", schedule);
      if (frame.current) cancelAnimationFrame(frame.current);
      if (el) {
        el.style.top = "";
        el.style.left = "";
        el.style.width = "";
        el.style.height = "";
      }
    };
  }, [ref]);
}
