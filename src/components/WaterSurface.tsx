"use client";

import { useEffect, useRef } from "react";

/**
 * Topographic contour lines — concentric circles from wave sources.
 * chaos=1: multiple sources, domain-warped → organic swirling patterns
 * chaos=0: single centred source, clean expanding rings
 */

interface WaveSource {
  x: number;
  y: number;
}

const CHAOS_SOURCES: WaveSource[] = [
  { x: 0.15, y: 0.25 },
  { x: 0.75, y: 0.15 },
  { x: 0.55, y: 0.80 },
  { x: 0.20, y: 0.75 },
];

const CALM_SOURCE: WaveSource = { x: 0.5, y: 0.5 };

export default function WaterSurface({
  chaos,
  className,
}: {
  chaos: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const chaosRef = useRef(chaos);
  chaosRef.current = chaos;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const q = 0.65;
      canvas.width = Math.round(rect.width * q);
      canvas.height = Math.round(rect.height * q);
    };
    resize();
    window.addEventListener("resize", resize);

    let time = 0;

    const draw = () => {
      time += 0.016;
      const c = chaosRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const maxDim = Math.hypot(W, H);

      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;

      // Active sources
      const sources: { cx: number; cy: number; intensity: number; maxR: number }[] = [];

      sources.push({
        cx: CALM_SOURCE.x * W,
        cy: CALM_SOURCE.y * H,
        intensity: 1 - c * 0.35,
        maxR: maxDim * 0.85,
      });

      for (let i = 0; i < CHAOS_SOURCES.length; i++) {
        const threshold = (i / CHAOS_SOURCES.length) * 0.5;
        const intensity = Math.max(0, Math.min(1, (c - threshold) / 0.4));
        if (intensity < 0.03) continue;
        sources.push({
          cx: CHAOS_SOURCES[i].x * W,
          cy: CHAOS_SOURCES[i].y * H,
          intensity,
          maxR: maxDim * 0.55,
        });
      }

      const spacing = 30;

      for (const src of sources) {
        for (let r = spacing; r < src.maxR; r += spacing) {
          const edgeFade = Math.pow(Math.max(0, 1 - r / src.maxR), 0.5);
          const pulse = 0.7 + 0.3 * Math.sin(r * 0.07 - time * 1.2);
          const alpha = 0.07 * src.intensity * edgeFade * pulse;
          if (alpha < 0.003) continue;

          ctx.strokeStyle = `rgba(37, 99, 235, ${alpha.toFixed(3)})`;
          ctx.beginPath();

          const steps = Math.max(48, Math.min(200, Math.floor(r * 0.35)));

          for (let s = 0; s <= steps; s++) {
            const angle = (s / steps) * Math.PI * 2;
            let x = src.cx + Math.cos(angle) * r;
            let y = src.cy + Math.sin(angle) * r;

            if (c > 0.005) {
              const warp = c * 40;
              x += Math.sin(y * 0.007 + time * 0.8) * warp;
              x += Math.sin(y * 0.014 + time * 1.4 + 1.3) * warp * 0.45;
              y += Math.cos(x * 0.007 + time * 0.6) * warp;
              y += Math.cos(x * 0.014 + time * 1.2 + 2.1) * warp * 0.45;
            }

            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          ctx.closePath();
          ctx.stroke();
        }
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
      style={{
        width: "100%",
        height: "100%",
        imageRendering: "auto",
      }}
    />
  );
}
