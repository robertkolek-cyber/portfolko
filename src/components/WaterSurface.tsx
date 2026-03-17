"use client";

import { useEffect, useRef } from "react";

/**
 * Concentric ring field — continuously expanding rings from wave sources.
 * chaos = 0 → single centre source, perfect thin rings, meditative calm
 * chaos = 1 → multiple overlapping sources, wobbly thick rings, interference
 */

interface RingSource {
  x: number; // normalised 0–1
  y: number;
  speed: number; // expansion rate multiplier
  phaseOffset: number;
}

const CENTER: RingSource = { x: 0.5, y: 0.5, speed: 1.0, phaseOffset: 0 };

const CHAOS_SOURCES: RingSource[] = [
  { x: 0.12, y: 0.22, speed: 1.3, phaseOffset: 0.15 },
  { x: 0.82, y: 0.18, speed: 1.1, phaseOffset: 0.40 },
  { x: 0.72, y: 0.78, speed: 0.9, phaseOffset: 0.65 },
  { x: 0.18, y: 0.76, speed: 1.4, phaseOffset: 0.30 },
  { x: 0.88, y: 0.52, speed: 1.2, phaseOffset: 0.80 },
];

const RINGS_PER_SOURCE = 12;
const POINTS_PER_RING = 200;
const TWO_PI = Math.PI * 2;

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

    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let time = 0;

    // Pre-allocate angle lookup
    const angles: number[] = [];
    for (let i = 0; i <= POINTS_PER_RING; i++) {
      angles.push((i / POINTS_PER_RING) * TWO_PI);
    }

    function drawSource(
      drawCtx: CanvasRenderingContext2D,
      sx: number,
      sy: number,
      speed: number,
      phaseOffset: number,
      baseAlpha: number,
      wobbleMul: number,
      lineWidth: number,
      ringCount: number,
    ) {
      const maxR = Math.hypot(w, h) * 0.55;

      for (let r = 0; r < ringCount; r++) {
        // Continuously expanding phase — rings born at centre, expand outward
        const phase = ((time * speed * 0.15 + phaseOffset + r / ringCount) % 1.0);
        const radius = phase * maxR;
        if (radius < 2) continue;

        // Fade: peak brightness in mid-range, transparent at edges and centre
        const fadeCentre = Math.min(1, radius / (maxR * 0.12));
        const fadeEdge = 1 - Math.pow(phase, 1.8);
        const alpha = baseAlpha * fadeCentre * fadeEdge;
        if (alpha < 0.005) continue;

        // Wobble: multi-frequency for organic feel
        const wobbleAmt = wobbleMul * radius * 0.08;

        drawCtx.beginPath();
        for (let i = 0; i <= POINTS_PER_RING; i++) {
          const a = angles[i];
          let noise = 0;
          if (wobbleAmt > 0.5) {
            noise += Math.sin(a * 3 + time * 1.4 + r * 0.7) * 0.40;
            noise += Math.sin(a * 7 - time * 0.9 + r * 0.4) * 0.25;
            noise += Math.sin(a * 13 + time * 2.3 + r * 1.1) * 0.15;
            noise += Math.cos(a * 5 - time * 1.7 + r * 0.9) * 0.20;
          }

          const R = radius + noise * wobbleAmt;
          // 0.6 Y ratio → perspective ellipse
          const x = sx + Math.cos(a) * R;
          const y = sy + Math.sin(a) * R * 0.6;

          if (i === 0) drawCtx.moveTo(x, y);
          else drawCtx.lineTo(x, y);
        }
        drawCtx.closePath();

        // Bloom: draw glow layer first (thicker, transparent)
        if (alpha > 0.03) {
          drawCtx.lineWidth = lineWidth + 3;
          drawCtx.strokeStyle = `rgba(37, 99, 235, ${alpha * 0.3})`;
          drawCtx.stroke();
        }

        // Crisp ring
        drawCtx.lineWidth = lineWidth;
        drawCtx.strokeStyle = `rgba(147, 197, 253, ${alpha})`;
        drawCtx.stroke();
      }
    }

    const draw = () => {
      time += 0.016;
      const c = chaosRef.current;

      ctx.clearRect(0, 0, w, h);

      // Centre source — always present, clean at calm, dimmed at peak chaos
      const centreAlpha = 0.12 * (1 - c * 0.4);
      const centreWobble = c * 0.7;
      const centreWidth = 0.6 + c * 0.3;
      drawSource(
        ctx,
        w * CENTER.x,
        h * CENTER.y,
        CENTER.speed,
        CENTER.phaseOffset,
        centreAlpha,
        centreWobble,
        centreWidth,
        RINGS_PER_SOURCE + 4,
      );

      // Chaos sources — fade in as chaos increases
      if (c > 0.15) {
        const intensity = Math.min(1, (c - 0.15) / 0.5);
        for (let s = 0; s < CHAOS_SOURCES.length; s++) {
          const src = CHAOS_SOURCES[s];
          // Stagger: later sources need more chaos
          const threshold = s / CHAOS_SOURCES.length;
          const srcIntensity = Math.max(0, Math.min(1, (intensity - threshold * 0.6) / 0.5));
          if (srcIntensity < 0.01) continue;

          drawSource(
            ctx,
            w * src.x,
            h * src.y,
            src.speed,
            src.phaseOffset,
            0.06 * srcIntensity,
            0.6 + srcIntensity * 0.4,
            0.5 + srcIntensity * 0.4,
            Math.floor(RINGS_PER_SOURCE * 0.6 * srcIntensity),
          );
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
      style={{ width: "100%", height: "100%" }}
    />
  );
}
