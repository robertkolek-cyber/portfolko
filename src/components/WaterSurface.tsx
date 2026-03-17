"use client";

import { useEffect, useRef } from "react";

/**
 * Top-down water surface — drop-based expanding ripples.
 *
 * Uses a proper wave model: discrete drops create expanding circular
 * wavefronts that interfere, attenuate, and create beautiful moiré.
 *
 * chaos=1: many overlapping drops, dense interference
 * chaos=0: single centred drop, pristine concentric rings
 */

/* ── Drop model ─────────────────────────────────────────────── */

interface Drop {
  x: number; // 0-1 normalised
  y: number;
  birthTime: number;
  amplitude: number;
  // Each drop emits several harmonic ring sets
  wavelengths: number[]; // px wavelengths at internal res
  speed: number; // px/s expansion speed
  decay: number; // amplitude halving distance
}

function makeDrop(
  x: number,
  y: number,
  t: number,
  amp: number,
  speed: number
): Drop {
  return {
    x,
    y,
    birthTime: t,
    amplitude: amp,
    // 3 harmonics per drop — gives each ring a richer, more organic look
    wavelengths: [
      14 + Math.random() * 6,
      26 + Math.random() * 8,
      44 + Math.random() * 12,
    ],
    speed: speed + (Math.random() - 0.5) * 8,
    decay: 120 + Math.random() * 60,
  };
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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Higher resolution for crisp rings
    const W = 480;
    const H = 320;
    canvas.width = W;
    canvas.height = H;

    const imgData = ctx.createImageData(W, H);
    const buf = imgData.data;

    let time = 0;
    const drops: Drop[] = [];
    let nextChaosDrop = 0;
    let lastCalmDrop = -999;

    // Seed a calm centre drop immediately
    drops.push(makeDrop(0.5, 0.5, 0, 0.9, 50));

    const draw = () => {
      const dt = 0.016;
      time += dt;
      const c = chaosRef.current;

      // ── Spawn drops based on chaos level ──
      // During chaos: frequent drops at random positions
      if (c > 0.1 && time >= nextChaosDrop) {
        const rate = 0.06 + (1 - c) * 0.25; // seconds between drops
        nextChaosDrop = time + rate;
        drops.push(
          makeDrop(
            0.08 + Math.random() * 0.84,
            0.08 + Math.random() * 0.84,
            time,
            0.4 + c * 0.6,
            40 + c * 25
          )
        );
      }

      // During calm: periodic centred drops (like a dripping faucet)
      if (c < 0.15 && time - lastCalmDrop > 2.8) {
        lastCalmDrop = time;
        drops.push(makeDrop(0.5, 0.5, time, 0.85, 48));
      }

      // Prune old drops (rings faded out)
      const MAX_AGE = 6.5;
      while (drops.length > 0 && time - drops[0].birthTime > MAX_AGE) {
        drops.shift();
      }

      // ── Render pixel field ──
      const cx = W * 0.5;
      const cy = H * 0.5;
      const maxDist = Math.hypot(cx, cy);

      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          let height = 0;

          // Sum wave contribution from every active drop
          for (const drop of drops) {
            const age = time - drop.birthTime;
            if (age < 0) continue;

            const dx = px - drop.x * W;
            const dy = py - drop.y * H;
            const dist = Math.hypot(dx, dy);

            // Wavefront radius at this moment
            const frontR = age * drop.speed;

            // Only contribute if the wavefront has reached this pixel
            // (with a soft leading edge)
            const behind = frontR - dist;
            if (behind < -2) continue;

            // Leading edge softness — wave fades in over ~8px
            const leadFade = Math.min(1, Math.max(0, behind / 8));

            // Distance attenuation — 1/sqrt(r) like real 2D waves
            const rAtten = 1 / (1 + dist / drop.decay);

            // Age fade — drop energy dissipates over time
            const ageFade = Math.max(0, 1 - age / MAX_AGE);
            const ageFadeSq = ageFade * ageFade;

            // Sum harmonics — each wavelength creates its own ring set
            let h = 0;
            for (const wl of drop.wavelengths) {
              h += Math.cos((dist / wl) * Math.PI * 2 - age * 3.0);
            }
            h /= drop.wavelengths.length;

            height += h * drop.amplitude * rAtten * ageFadeSq * leadFade;
          }

          // ── Map height to visual ──

          // Normalise height to roughly -1..1 range
          const nh = Math.max(-1, Math.min(1, height));

          // Ring extraction: we want *thin bright lines* where height peaks,
          // dark between them — like looking down at water caustics
          // Use the absolute derivative (gradient magnitude) to find ring edges
          const ring = Math.pow(Math.abs(nh), 0.6);

          // Also use height directly for subtle ambient fill
          const fill = (nh + 1) * 0.5; // 0-1

          // Combine: ring edges dominate, with soft fill underneath
          const brightness = ring * 0.7 + fill * 0.3;

          // ── Color ──
          // Base: cool blue. Peaks: warmer cyan. Troughs: deeper indigo.
          const warmShift = nh * 0.5 + 0.5; // 0=trough, 1=peak

          const r = Math.round(60 + warmShift * 90 + brightness * 40);
          const g = Math.round(120 + warmShift * 70 + brightness * 55);
          const b = Math.round(200 + warmShift * 25 + brightness * 30);

          // ── Alpha ──
          // Subtle overall, brighter at ring peaks
          // Edge vignette
          const normDist = Math.hypot(px - cx, py - cy) / maxDist;
          const vignette = 1 - Math.pow(normDist, 2) * 0.5;

          const alpha = brightness * (0.14 + c * 0.1) * vignette;

          const idx = (py * W + px) * 4;
          buf[idx] = Math.min(255, r);
          buf[idx + 1] = Math.min(255, g);
          buf[idx + 2] = Math.min(255, b);
          buf[idx + 3] = Math.round(Math.min(1, alpha) * 255);
        }
      }

      ctx.putImageData(imgData, 0, 0);
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
