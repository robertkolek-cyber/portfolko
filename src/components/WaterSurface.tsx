"use client";

import { useEffect, useRef } from "react";

/**
 * Top-down water surface — circular ripples from wave sources.
 * chaos=1: many sources interfering (complex, choppy)
 * chaos=0: single source, clean expanding rings (clarity)
 */

interface WaveSource {
  // Normalised 0–1 coords
  x: number;
  y: number;
  frequency: number;
  amplitude: number;
  speed: number;
  phase: number;
}

// Multiple interference sources — active at high chaos
const CHAOS_SOURCES: WaveSource[] = [
  { x: 0.15, y: 0.25, frequency: 0.045, amplitude: 1.0, speed: 1.8, phase: 0.0 },
  { x: 0.75, y: 0.15, frequency: 0.038, amplitude: 0.9, speed: 2.1, phase: 1.3 },
  { x: 0.55, y: 0.80, frequency: 0.052, amplitude: 0.85, speed: 1.5, phase: 2.7 },
  { x: 0.20, y: 0.75, frequency: 0.030, amplitude: 0.95, speed: 2.4, phase: 0.8 },
  { x: 0.85, y: 0.60, frequency: 0.060, amplitude: 0.7, speed: 1.2, phase: 3.5 },
  { x: 0.45, y: 0.35, frequency: 0.042, amplitude: 0.8, speed: 2.8, phase: 4.2 },
  { x: 0.10, y: 0.55, frequency: 0.035, amplitude: 0.75, speed: 1.6, phase: 5.1 },
  { x: 0.90, y: 0.35, frequency: 0.055, amplitude: 0.65, speed: 2.0, phase: 2.1 },
];

// The one calm source — centre of the canvas
const CALM_SOURCE: WaveSource = {
  x: 0.5, y: 0.5,
  frequency: 0.028,
  amplitude: 1.0,
  speed: 0.8,
  phase: 0.0,
};

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

    // Internal resolution — low enough to be fast, high enough to be smooth
    const RES_W = 320;
    const RES_H = 200;
    canvas.width = RES_W;
    canvas.height = RES_H;
    ctx.imageSmoothingEnabled = true;

    const imageData = ctx.createImageData(RES_W, RES_H);
    const buf = imageData.data;

    let time = 0;

    const draw = () => {
      time += 0.016;
      const c = chaosRef.current;

      for (let py = 0; py < RES_H; py++) {
        for (let px = 0; px < RES_W; px++) {
          const nx = px / RES_W; // normalised
          const ny = py / RES_H;

          // Sum all wave heights at this point
          let height = 0;

          // Calm source — always present, fades slightly at peak chaos
          const calmDist = Math.hypot(nx - CALM_SOURCE.x, ny - CALM_SOURCE.y);
          const calmH =
            Math.sin(
              calmDist * CALM_SOURCE.frequency * RES_W -
              time * CALM_SOURCE.speed +
              CALM_SOURCE.phase
            ) *
            CALM_SOURCE.amplitude *
            (1 - c * 0.6); // calm wave dims during chaos
          height += calmH;

          // Chaos sources — each fades in with staggered threshold
          for (let i = 0; i < CHAOS_SOURCES.length; i++) {
            const src = CHAOS_SOURCES[i];
            // Stagger: later sources need higher chaos to appear
            const threshold = (i / CHAOS_SOURCES.length) * 0.7;
            const intensity = Math.max(
              0,
              Math.min(1, (c - threshold) / 0.35)
            );
            if (intensity < 0.01) continue;

            const dist = Math.hypot(nx - src.x, ny - src.y);
            // Wave attenuates with distance
            const attenuation = Math.max(0.1, 1 - dist * 0.8);
            const h =
              Math.sin(
                dist * src.frequency * RES_W -
                time * src.speed +
                src.phase
              ) *
              src.amplitude *
              intensity *
              attenuation;
            height += h;
          }

          // Map height to colour — lime green with alpha from wave height
          const normalised = (height + 1.5) / 3.0; // 0–1 range (rough)
          const clamped = Math.max(0, Math.min(1, normalised));

          // During calm: thin bright rings on dark bg (high contrast)
          // During chaos: dense bright soup
          const ringSharpness = 1 - c * 0.5;
          // Sharpen to rings by applying a soft threshold
          const ringed =
            Math.pow(
              Math.abs(Math.sin(clamped * Math.PI * (4 + c * 8))),
              0.5 + ringSharpness * 1.5
            );

          const idx = (py * RES_W + px) * 4;
          // Blend light blue → royal blue based on chaos level
          buf[idx]     = Math.round(147 + (37  - 147) * c * 0.7); // R
          buf[idx + 1] = Math.round(197 + (99  - 197) * c * 0.7); // G
          buf[idx + 2] = Math.round(253 + (235 - 253) * c * 0.7); // B
          buf[idx + 3] = Math.round(ringed * (0.20 + c * 0.15) * 255);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
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
