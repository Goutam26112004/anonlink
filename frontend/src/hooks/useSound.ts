'use client';

import { useRef, useCallback, useEffect } from 'react';

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const initializedRef = useRef(false);

  const init = useCallback(() => {
    if (initializedRef.current) return;
    try {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      initializedRef.current = true;
    } catch {}
  }, []);

  const playClick = useCallback(() => {
    init();
    const ctx = ctxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }, [init]);

  const playHover = useCallback(() => {
    init();
    const ctx = ctxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }, [init]);

  const playAmbient = useCallback(() => {
    init();
    const ctx = ctxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const mainGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, ctx.currentTime);
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.3, ctx.currentTime);
    lfoGain.gain.setValueAtTime(8, ctx.currentTime);
    lfo.connect(lfoGain).connect(osc.frequency);
    mainGain.gain.setValueAtTime(0.03, ctx.currentTime);
    osc.connect(mainGain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    lfo.start(ctx.currentTime);
    ambientRef.current = osc;
    gainRef.current = mainGain;
  }, [init]);

  const stopAmbient = useCallback(() => {
    try {
      ambientRef.current?.stop();
      ambientRef.current?.disconnect();
    } catch {}
    try {
      gainRef.current?.disconnect();
    } catch {}
    ambientRef.current = null;
    gainRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopAmbient();
      ctxRef.current?.close();
    };
  }, [stopAmbient]);

  return { playClick, playHover, playAmbient, stopAmbient };
}
