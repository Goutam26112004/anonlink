"use client";

import { AnonBlob } from "./AnonBlob";

interface HeroSceneProps {
  className?: string;
}

export function HeroScene({ className = "" }: HeroSceneProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Large gradient blobs */}
      <div
        className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)",
          opacity: 0.04,
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          opacity: 0.04,
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-1/3 h-1/3 rounded-full"
        style={{
          background: "radial-gradient(circle, var(--lavender) 0%, transparent 70%)",
          opacity: 0.03,
          filter: "blur(100px)",
        }}
      />

      {/* Animated blobs */}
      <AnonBlob
        color="var(--brand)"
        size={180}
        className="absolute -top-12 -left-12 animate-float"
      />
      <AnonBlob
        color="var(--accent)"
        size={140}
        className="absolute bottom-1/4 -right-8 animate-float-double"
        delay={2}
      />
      <AnonBlob
        color="var(--lavender)"
        size={100}
        className="absolute top-1/2 left-1/4 animate-float"
        delay={4}
      />

      {/* Connection lines pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 400 400">
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--text-primary)" strokeWidth="0.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}
