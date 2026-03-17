"use client";

import { useEffect, useRef } from "react";

/**
 * Water surface — concentric expanding rings with additive blending.
 *
 * chaos=0 → single centred drop every ~3s, 12 pristine rings, meditative
 * chaos=1 → rain of drops, rings collide, interference glows at intersections
 *
 * Every ring is a real canvas arc. Additive compositing means overlapping
 * rings brighten naturally — no fake interference math needed.
 */

interface Drop {
  cx: number;
  cy: number;
  birth: number;
  ringCount: number;
  ringSpacing: number;
  speed: number;       // px/s outward expansion
  amplitude: number;   // base brightness 0-1
  hueShift: number;    // ±degrees from base 215°
}

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

    // ── Constants ──
    const MAX_AGE = 8;

    // ── State ──
    const drops: Drop[] = [];
    let time = 0;
    let nextChaosDrop = 0;
    let lastCalmDrop = -10;

    // Helper: spawn a calm centred drop
    const spawnCalm = (t: number) => {
      drops.push({
        cx: W * 0.5 + (Math.random() - 0.5) * 2,
        cy: H * 0.5 + (Math.random() - 0.5) * 2,
        birth: t,
        ringCount: 12,
        ringSpacing: 22,
        speed: 36,
        amplitude: 0.8,
        hueShift: (Math.random() - 0.5) * 6,
      });
    };

    // Seed: place calm drops in the past so rings are already visible on load
    spawnCalm(-5.0);
    spawnCalm(-2.2);
    spawnCalm(0);

    // ── Draw loop ──
    const draw = () => {
      time += 0.016;
      const c = chaosRef.current;

      // ── Spawn ──

      // Chaos drops — rain across the surface
      if (c > 0.06 && time >= nextChaosDrop) {
        const interval = Math.max(0.05, 0.08 + (1 - c) * 0.4);
        nextChaosDrop = time + interval;

        const burst = c > 0.75 && Math.random() < 0.25 ? 2 : 1;
        for (let b = 0; b < burst; b++) {
          drops.push({
            cx: W * (0.04 + Math.random() * 0.92),
            cy: H * (0.04 + Math.random() * 0.92),
            birth: time + b * 0.03,
            ringCount: 4 + Math.floor(Math.random() * 4),
            ringSpacing: 16 + Math.random() * 10,
            speed: 42 + Math.random() * 30 + c * 20,
            amplitude: 0.25 + c * 0.55 + Math.random() * 0.2,
            hueShift: (Math.random() - 0.5) * 20,
          });
        }
      }

      // Calm drops — slow, centred, breathing
      if (c < 0.1 && time - lastCalmDrop > 3.0) {
        lastCalmDrop = time;
        spawnCalm(time);
      }

      // Prune dead drops
      while (drops.length > 0 && time - drops[0].birth > MAX_AGE) {
        drops.shift();
      }
      if (drops.length > 60) drops.splice(0, drops.length - 60);

      // ── Render ──
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      for (const drop of drops) {
        const age = time - drop.birth;
        if (age < 0) continue;

        // Quadratic age fade
        const life = Math.max(0, 1 - age / MAX_AGE);
        const lifeSq = life * life;
        if (lifeSq < 0.003) continue;

        // Impact flash — bright point at drop origin for first 0.2s
        if (age < 0.2) {
          const flashT = age / 0.2;
          const flashAlpha = (1 - flashT) * (1 - flashT) * drop.amplitude * 0.6;
          const flashR = 3 + flashT * 8;
          ctx.beginPath();
          ctx.arc(drop.cx, drop.cy, flashR, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(215, 50%, 85%, ${flashAlpha})`;
          ctx.fill();
        }

        const baseAlpha = drop.amplitude * lifeSq;

        // Draw rings
        for (let i = 0; i < drop.ringCount; i++) {
          const radius = age * drop.speed + i * drop.ringSpacing;
          if (radius < 0.5) continue;

          // Per-ring fade: inner rings brighter
          const ringFade = 1 - (i / drop.ringCount) * 0.55;

          // Distance attenuation
          const distFade = 1 / (1 + radius * 0.005);

          const alpha = baseAlpha * ringFade * distFade;
          if (alpha < 0.002) continue;

          // Line width tapers outward
          const lw = Math.max(0.4, 1.6 - i * 0.1);

          // Colour: cool moonlight blue, subtle hue shift per drop
          const hue = 215 + drop.hueShift;

          // Pass 1: soft glow (wide, faint)
          ctx.beginPath();
          ctx.arc(drop.cx, drop.cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${hue}, 45%, 75%, ${Math.min(0.5, alpha * 0.18)})`;
          ctx.lineWidth = lw * 5;
          ctx.stroke();

          // Pass 2: crisp ring
          ctx.beginPath();
          ctx.arc(drop.cx, drop.cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${hue}, 55%, 72%, ${Math.min(0.8, alpha * 0.55)})`;
          ctx.lineWidth = lw;
          ctx.stroke();

          // Pass 3: bright core (very thin, inner rings only)
          if (i < drop.ringCount * 0.4) {
            ctx.beginPath();
            ctx.arc(drop.cx, drop.cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${hue + 5}, 40%, 88%, ${Math.min(0.6, alpha * 0.3)})`;
            ctx.lineWidth = Math.max(0.3, lw * 0.4);
            ctx.stroke();
          }
        }
      }

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
      style={{ width: "100%", height: "100%" }}
    />
  );
}
