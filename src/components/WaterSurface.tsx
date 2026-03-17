"use client";

import { useEffect, useRef } from "react";

/**
 * Top-down water surface — actual expanding ring strokes with
 * additive blending. Where rings from different drops overlap
 * they glow brighter, creating natural interference.
 *
 * chaos → many drops, dense luminous collisions
 * calm  → single centred drop, pristine concentric rings
 */

/* ── Drop ───────────────────────────────────────────────────── */

interface Drop {
  cx: number; // pixel position (set at spawn, scaled to canvas)
  cy: number;
  birth: number; // time of impact
  rings: number; // how many concentric rings this drop emits
  spacing: number; // px between rings
  speed: number; // px/s ring expansion
  amplitude: number; // 0-1 base brightness
  hue: number; // slight colour variation per drop
}

/* ── Component ──────────────────────────────────────────────── */

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
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;

    const resize = () => {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const drops: Drop[] = [];
    let time = 0;
    let nextChaosDrop = 0;
    let lastCalmDrop = -10;

    // Seed first calm drop
    drops.push({
      cx: W * 0.5,
      cy: H * 0.5,
      birth: 0,
      rings: 8,
      spacing: 32 + Math.random() * 8,
      speed: 52,
      amplitude: 0.9,
      hue: 0,
    });

    const MAX_AGE = 7;

    const draw = () => {
      time += 0.016;
      const c = chaosRef.current;

      // ── Spawn logic ──

      // Chaos: rain of drops
      if (c > 0.08 && time >= nextChaosDrop) {
        // Higher chaos → more frequent, more drops
        const interval = 0.04 + (1 - c) * 0.35;
        nextChaosDrop = time + interval;

        // Occasionally spawn 2-3 simultaneous drops at high chaos
        const burstCount = c > 0.7 && Math.random() < 0.3 ? 2 : 1;
        for (let b = 0; b < burstCount; b++) {
          drops.push({
            cx: W * (0.05 + Math.random() * 0.9),
            cy: H * (0.05 + Math.random() * 0.9),
            birth: time + b * 0.02,
            rings: 5 + Math.floor(Math.random() * 4),
            spacing: 22 + Math.random() * 18,
            speed: 38 + Math.random() * 30 + c * 15,
            amplitude: 0.3 + c * 0.5 + Math.random() * 0.2,
            hue: Math.random() * 30 - 15, // ±15 degrees variation
          });
        }
      }

      // Calm: slow centred drops
      if (c < 0.12) {
        const calmInterval = 2.6 + (1 - c) * 0.5;
        if (time - lastCalmDrop > calmInterval) {
          lastCalmDrop = time;
          drops.push({
            cx: W * 0.5 + (Math.random() - 0.5) * 4,
            cy: H * 0.5 + (Math.random() - 0.5) * 3,
            birth: time,
            rings: 8,
            spacing: 30 + Math.random() * 10,
            speed: 48 + Math.random() * 8,
            amplitude: 0.85,
            hue: Math.random() * 10 - 5,
          });
        }
      }

      // Prune
      while (drops.length > 0 && time - drops[0].birth > MAX_AGE) {
        drops.shift();
      }
      // Safety cap
      if (drops.length > 80) drops.splice(0, drops.length - 80);

      // ── Draw ──
      ctx.clearRect(0, 0, W, H);

      // Additive blending — overlapping rings glow brighter
      ctx.globalCompositeOperation = "lighter";

      for (const drop of drops) {
        const age = time - drop.birth;
        if (age < 0) continue;

        // Age fade — quadratic falloff
        const ageFade = Math.max(0, 1 - age / MAX_AGE);
        const ageFactor = ageFade * ageFade;
        if (ageFactor < 0.005) continue;

        const baseAlpha = drop.amplitude * ageFactor;

        // Draw each concentric ring
        for (let r = 0; r < drop.rings; r++) {
          const radius = age * drop.speed + r * drop.spacing;
          if (radius < 1) continue;

          // Ring-level fade: outer rings are fainter
          const ringFade = 1 - (r / drop.rings) * 0.6;

          // Radius-based attenuation — 1/sqrt for natural wave decay
          const distAtten = 1 / Math.sqrt(1 + radius * 0.008);

          // Pulse: rings subtly breathe (amplitude oscillates)
          const pulse = 0.85 + Math.sin(age * 2.2 - r * 0.7) * 0.15;

          const alpha = baseAlpha * ringFade * distAtten * pulse;
          if (alpha < 0.003) continue;

          // Line width: inner rings slightly thicker, outer rings thinner
          const lw = Math.max(0.5, 1.8 - r * 0.12 - radius * 0.001);

          // Colour: base blue 210°, shifted by drop hue
          // Brighter rings lean toward cyan, fainter toward deep blue
          const hue = 210 + drop.hue + ringFade * 8;
          const sat = 70 + (1 - ringFade) * 20;
          const light = 60 + ringFade * 15;

          // Crisp ring
          ctx.beginPath();
          ctx.arc(drop.cx, drop.cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${Math.min(1, alpha * 0.6)})`;
          ctx.lineWidth = lw;
          ctx.stroke();

          // Soft glow ring (wider, fainter) for that luminous water feel
          ctx.beginPath();
          ctx.arc(drop.cx, drop.cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${hue + 5}, ${sat - 10}%, ${light + 10}%, ${Math.min(1, alpha * 0.15)})`;
          ctx.lineWidth = lw * 5;
          ctx.stroke();
        }
      }

      // Reset composite
      ctx.globalCompositeOperation = "source-over";

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
      }}
    />
  );
}
