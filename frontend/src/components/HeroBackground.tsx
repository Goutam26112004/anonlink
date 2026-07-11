"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface HeroBackgroundProps {
  className?: string;
}

function ConnectionNodes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let nodes: Node[] = [];
    const NODE_COUNT = 18;
    const CONNECTION_DIST = 140;
    const SPEED = 0.15;

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const init = () => {
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
      }));
    };

    const draw = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.getAttribute("data-theme") !== "light";

      for (let i = 0; i < nodes.length; i++) {
        nodes[i].x += nodes[i].vx;
        nodes[i].y += nodes[i].vy;

        if (nodes[i].x < 0 || nodes[i].x > canvas.width) nodes[i].vx *= -1;
        if (nodes[i].y < 0 || nodes[i].y > canvas.height) nodes[i].vy *= -1;

        nodes[i].x = Math.max(2, Math.min(canvas.width - 2, nodes[i].x));
        nodes[i].y = Math.max(2, Math.min(canvas.height - 2, nodes[i].y));
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            const opacity = Math.max(0, (1 - dist / CONNECTION_DIST) * 0.08);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = isDark
              ? `rgba(99, 102, 241, ${opacity})`
              : `rgba(79, 70, 229, ${opacity})`;
            ctx.stroke();
          }
        }
      }

      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? "rgba(99, 102, 241, 0.15)"
          : "rgba(79, 70, 229, 0.12)";
        ctx.fill();
      }

      animFrame = requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

export function HeroBackground({ className = "" }: HeroBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {/* Large gradient orbs - static */}
      <div
        className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full animate-morph-glow"
        style={{
          background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-1/4 -right-1/4 w-[50%] h-[50%] rounded-full animate-morph-glow"
        style={{
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          animationDelay: "2s",
        }}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[40%] h-[40%] rounded-full animate-morph-glow"
        style={{
          background: "radial-gradient(circle, var(--lavender) 0%, transparent 70%)",
          animationDelay: "4s",
        }}
      />

      {/* Animated morphing blobs */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.06 }}
      >
        <defs>
          <linearGradient id="blob-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--lavender)" />
          </linearGradient>
          <linearGradient id="blob-grad-2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--brand)" />
          </linearGradient>
        </defs>

        <g className="animate-drift" style={{ animationDuration: "20s" }}>
          <path
            d="M200,400 C300,200 500,100 700,200 C900,300 1000,500 800,700 C600,900 300,800 200,600 C100,500 100,600 200,400Z"
            fill="url(#blob-grad-1)"
            opacity={0.5}
          />
        </g>

        <g className="animate-drift" style={{ animationDuration: "25s", animationDelay: "-5s" }}>
          <path
            d="M900,200 C1100,100 1300,300 1200,500 C1100,700 800,800 600,600 C400,400 500,300 700,250 C800,200 700,300 900,200Z"
            fill="url(#blob-grad-2)"
            opacity={0.4}
          />
        </g>
      </svg>

      {/* Connection nodes canvas */}
      <ConnectionNodes />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle, var(--text-primary) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
