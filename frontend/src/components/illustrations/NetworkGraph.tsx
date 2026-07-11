"use client";

import { useEffect, useState } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  from: number;
  to: number;
}

interface NetworkGraphProps {
  className?: string;
  nodeCount?: number;
  connectionRadius?: number;
  color?: string;
  width?: number;
  height?: number;
}

export function NetworkGraph({
  className = "",
  nodeCount = 24,
  connectionRadius = 80,
  color = "var(--brand)",
  width = 400,
  height = 300,
}: NetworkGraphProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    const initialNodes: Node[] = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    const initialEdges: Edge[] = [];
    for (let i = 0; i < initialNodes.length; i++) {
      for (let j = i + 1; j < initialNodes.length; j++) {
        const dx = initialNodes[i].x - initialNodes[j].x;
        const dy = initialNodes[i].y - initialNodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < connectionRadius) {
          initialEdges.push({ from: i, to: j });
        }
      }
    }

    setNodes(initialNodes);
    setEdges(initialEdges);

    let frame: number;
    const animate = () => {
      setNodes((prev) =>
        prev.map((n) => {
          let nx = n.x + n.vx;
          let ny = n.y + n.vy;
          if (nx < 0 || nx > width) n.vx *= -1;
          if (ny < 0 || ny > height) n.vy *= -1;
          nx = Math.max(4, Math.min(width - 4, nx));
          ny = Math.max(4, Math.min(height - 4, ny));
          return { ...n, x: nx, y: ny };
        })
      );

      setEdges(() => {
        const newEdges: Edge[] = [];
        const currentNodes = nodes;
        if (currentNodes.length === 0) return newEdges;
        for (let i = 0; i < currentNodes.length; i++) {
          for (let j = i + 1; j < currentNodes.length; j++) {
            const dx = currentNodes[i].x - currentNodes[j].x;
            const dy = currentNodes[i].y - currentNodes[j].y;
            if (Math.sqrt(dx * dx + dy * dy) < connectionRadius) {
              newEdges.push({ from: i, to: j });
            }
          }
        }
        return newEdges;
      });

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [nodeCount, connectionRadius, width, height]);

  if (nodes.length === 0) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ overflow: "visible" }}
    >
      {edges.map((edge, i) => {
        const from = nodes[edge.from];
        const to = nodes[edge.to];
        if (!from || !to) return null;
        const dx = from.x - to.x;
        const dy = from.y - to.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const opacity = Math.max(0.05, 1 - dist / connectionRadius);
        return (
          <line
            key={`e-${i}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={color}
            strokeOpacity={opacity * 0.3}
            strokeWidth={1}
          />
        );
      })}
      {nodes.map((node, i) => (
        <circle
          key={`n-${i}`}
          cx={node.x}
          cy={node.y}
          r={2}
          fill={color}
          fillOpacity={0.6}
        >
          <animate
            attributeName="r"
            values="1.5;2.5;1.5"
            dur={`${3 + (i % 3)}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}
