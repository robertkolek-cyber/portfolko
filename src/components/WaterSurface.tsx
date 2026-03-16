"use client";

import { useEffect, useRef } from "react";

/**
 * Water surface rendered as horizontal wave lines.
 * `chaos` 0–1 controls how many waves interfere:
 *   1 = many overlapping waves (complexity)
 *   0 = one gentle sine (clarity)
 */

interface Wave {
  frequency: number;
  amplitude: number;
  speed: number;
  phase: number;
  direction: number; // angle offset for slight diagonal movement
}

// The waves that exist during chaos — all interfering
const CHAOS_WAVES: Wave[] = [
  { frequency: 0.008, amplitude: 18, speed: 0.9, phase: 0, direction: 0 },
  { frequency: 0.012, amplitude: 14, speed: -1.3, phase: 1.2, direction: 0.3 },
  { frequency: 0.02, amplitude: 10, speed: 1.7, phase: 2.8, direction: -0.2 },
  { frequency: 0.006, amplitude: 22, speed: -0.6, phase: 0.5, direction: 0.15 },
  { frequency: 0.025, amplitude: 7, speed: 2.2, phase: 4.1, direction: -0.4 },
  { frequency: 0.015, amplitude: 12, speed: -1.0, phase: 3.3, direction: 0.25 },
  { frequency: 0.035, amplitude: 5, speed: 2.8, phase: 1.7, direction: -0.1 },
  { frequency: 0.009, amplitude: 16, speed: 0.7, phase: 5.0, direction: 0.35 },
  { frequency: 0.045, amplitude: 3, speed: -3.2, phase: 2.1, direction: 0.1 },
  { frequency: 0.018, amplitude: 9, speed: 1.5, phase: 0.8, direction: -0.3 },
];

// The single calm wave
const CALM_WAVE: Wave = {
  frequency: 0.004,
  amplitude: 12,
  speed: 0.35,
  phase: 0,
  direction: 0,
};

function getWaveHeight(
  x: number,
  y: number,
  t: number,
  chaos: number
): number {
  // Single calm wave — always present
  const calmH =
    Math.sin(x * CALM_WAVE.frequency + t * CALM_WAVE.speed + CALM_WAVE.phase) *
    CALM_WAVE.amplitude;

  if (chaos < 0.01) return calmH;

  // Chaos waves — each fades in/out based on chaos level
  let chaosH = 0;
  for (let i = 0; i < CHAOS_WAVES.length; i++) {
    const w = CHAOS_WAVES[i];
    // Stagger: earlier waves appear at lower chaos levels
    const threshold = i / CHAOS_WAVES.length;
    const waveIntensity = Math.max(
      0,
      Math.min(1, (chaos - threshold * 0.6) / 0.4)
    );
    if (waveIntensity < 0.01) continue;

    const xOff = x * Math.cos(w.direction) + y * Math.sin(w.direction);
    chaosH +=
      Math.sin(xOff * w.frequency + t * w.speed + w.phase) *
      w.amplitude *
      waveIntensity;
  }

  // Blend: calm wave stays, chaos waves layer on top
  // As chaos → 0, only the calm wave remains
  return calmH * (1 - chaos * 0.3) + chaosH;
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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    let time = 0;

    const draw = () => {
      time += 0.016;
      const c = chaosRef.current;
      ctx.clearRect(0, 0, w, h);

      // Number of horizontal wave lines
      const lineCount = 50;
      const lineSpacing = h / lineCount;

      for (let i = 0; i < lineCount; i++) {
        const baseY = i * lineSpacing + lineSpacing * 0.5;

        // Depth factor — lines near center are brighter
        const centerDist = Math.abs(baseY - h * 0.5) / (h * 0.5);
        const depthAlpha = (1 - centerDist * 0.7) * 0.25;

        // Draw the wave line
        ctx.beginPath();

        const step = 4; // pixel step for smoothness
        for (let x = 0; x <= w; x += step) {
          const waveH = getWaveHeight(x, baseY, time, c);
          const y = baseY + waveH;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Line color — lime with depth-based alpha
        const alpha = depthAlpha * (0.6 + c * 0.4);
        ctx.strokeStyle = `rgba(194, 224, 58, ${alpha})`;
        ctx.lineWidth = 0.8 + (1 - centerDist) * 0.4;
        ctx.stroke();

        // Highlight peaks — bright dots at wave crests during chaos
        if (c > 0.2) {
          const highlightAlpha = (c - 0.2) * 0.5 * depthAlpha;
          for (let x = 0; x <= w; x += step * 8) {
            const waveH = getWaveHeight(x, baseY, time, c);
            // Only at peaks (positive height, high curvature)
            const waveH2 = getWaveHeight(x + 2, baseY, time, c);
            const waveH0 = getWaveHeight(x - 2, baseY, time, c);
            const curvature = waveH0 + waveH2 - 2 * waveH;
            if (curvature < -0.3 && waveH > 5) {
              const y = baseY + waveH;
              ctx.beginPath();
              ctx.arc(x, y, 1, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(194, 224, 58, ${highlightAlpha})`;
              ctx.fill();
            }
          }
        }
      }

      // Subtle reflection line at center — more visible in calm
      if (c < 0.7) {
        const reflAlpha = (1 - c) * 0.06;
        const centerY = h * 0.5;
        const waveH = getWaveHeight(w * 0.5, centerY, time, c);
        ctx.beginPath();
        ctx.moveTo(0, centerY + waveH * 0.3);
        for (let x = 0; x <= w; x += 6) {
          const hh = getWaveHeight(x, centerY, time, c);
          ctx.lineTo(x, centerY + hh * 0.3);
        }
        ctx.strokeStyle = `rgba(194, 224, 58, ${reflAlpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
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
