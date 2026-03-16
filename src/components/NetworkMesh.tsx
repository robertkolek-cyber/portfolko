"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient floating network — purely decorative.
 * Gentle drifting nodes connected by dashed lime lines.
 * No morphing, no scroll-coupling. Just atmosphere.
 */

interface Node {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  speed: number;
  phase: number;
  amplitude: number;
}

export default function NetworkMesh({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const nodesRef = useRef<Node[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const seed = (i: number) => {
      // Deterministic pseudo-random per node
      const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    };

    const init = () => {
      const count = 14;
      const nodes: Node[] = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: 0,
          y: 0,
          baseX: seed(i) * w,
          baseY: seed(i + 50) * h,
          radius: 2 + seed(i + 100) * 2.5,
          speed: 0.15 + seed(i + 150) * 0.2,
          phase: seed(i + 200) * Math.PI * 2,
          amplitude: 20 + seed(i + 250) * 40,
        });
      }
      nodesRef.current = nodes;
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init();
    };

    resize();
    window.addEventListener("resize", resize);

    let time = 0;

    const draw = () => {
      time += 0.016;
      ctx.clearRect(0, 0, w, h);
      const nodes = nodesRef.current;

      // Update positions — slow Lissajous drift
      for (const n of nodes) {
        n.x = n.baseX + Math.sin(time * n.speed + n.phase) * n.amplitude;
        n.y =
          n.baseY +
          Math.cos(time * n.speed * 0.7 + n.phase * 1.3) * n.amplitude * 0.6;
      }

      // Draw edges — connect nearby nodes
      const maxDist = 220;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dist = Math.hypot(b.x - a.x, b.y - a.y);
          if (dist > maxDist) continue;

          const alpha = (1 - dist / maxDist) * 0.15;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.setLineDash([6, 5]);
          ctx.lineDashOffset = -time * 12 + i * 20;
          ctx.strokeStyle = `rgba(194, 224, 58, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Draw nodes
      for (const n of nodes) {
        // Ring
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(194, 224, 58, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(194, 224, 58, 0.2)";
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
