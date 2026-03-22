"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

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

// Fewer, gentler interference sources — active at high chaos
const CHAOS_SOURCES: WaveSource[] = [
  { x: 0.19, y: 0.25, frequency: 0.035, amplitude: 0.58, speed: 1.5, phase: 0.0 },
  { x: 0.79, y: 0.19, frequency: 0.030, amplitude: 0.52, speed: 1.8, phase: 1.6 },
  { x: 0.23, y: 0.73, frequency: 0.032, amplitude: 0.50, speed: 1.3, phase: 0.8 },
  { x: 0.80, y: 0.65, frequency: 0.038, amplitude: 0.48, speed: 1.4, phase: 3.5 },
];

// The one calm source — centre of the canvas
const CALM_SOURCE: WaveSource = {
  x: 0.5, y: 0.5,
  frequency: 0.028,
  amplitude: 1.0,
  speed: 0.8,
  phase: 0.0,
};

// ── Color blobs that drift across the canvas ──
// Each has an orbit center, radius, speed, phase, and two color sets (muted / neon)
const COLOR_BLOBS = [
  { cx: 0.3,  cy: 0.3,  rx: 0.25, ry: 0.20, speed: 0.13, phase: 0.0,   radius: 0.55,
    muted: [175, 155, 180], neon: [255, 30, 120] },   // mauve → magenta
  { cx: 0.7,  cy: 0.25, rx: 0.22, ry: 0.18, speed: 0.09, phase: 2.1,   radius: 0.50,
    muted: [140, 170, 200], neon: [0, 180, 255] },    // slate → cyan
  { cx: 0.5,  cy: 0.65, rx: 0.30, ry: 0.22, speed: 0.11, phase: 4.2,   radius: 0.60,
    muted: [155, 185, 170], neon: [0, 255, 160] },    // sage → mint
  { cx: 0.2,  cy: 0.7,  rx: 0.18, ry: 0.25, speed: 0.15, phase: 1.0,   radius: 0.45,
    muted: [160, 140, 185], neon: [200, 50, 255] },   // lavender → violet
  { cx: 0.8,  cy: 0.7,  rx: 0.20, ry: 0.15, speed: 0.07, phase: 3.3,   radius: 0.50,
    muted: [185, 175, 150], neon: [255, 220, 0] },    // khaki → yellow
  { cx: 0.5,  cy: 0.2,  rx: 0.28, ry: 0.16, speed: 0.12, phase: 5.5,   radius: 0.48,
    muted: [165, 150, 165], neon: [255, 80, 200] },   // grey-pink → hot pink
  { cx: 0.4,  cy: 0.5,  rx: 0.15, ry: 0.28, speed: 0.10, phase: 0.7,   radius: 0.52,
    muted: [150, 175, 185], neon: [60, 220, 255] },   // steel → sky blue
];

export default function WaterSurface({
  chaos,
  className,
  mousePosRef,
}: {
  chaos: number;
  className?: string;
  mousePosRef?: MutableRefObject<{ x: number; y: number } | null>;
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

    // Smoothed mouse position for disruption (finger-in-water effect)
    const finger = { x: -1, y: -1, strength: 0 };

    const draw = () => {
      const dt = 0.016;
      time += dt;
      const c = chaosRef.current;

      // ── Fixed centre — ripples always emanate from the middle ──
      const cx = CALM_SOURCE.x;
      const cy = CALM_SOURCE.y;

      // ── Mouse disruption — "finger in water" blocker ──
      const mouse = mousePosRef?.current;
      const hasTarget = mouse !== null && mouse !== undefined;
      const targetStrength = hasTarget ? (1 - c) * (1 - c) : 0;
      // Smoothly ramp disruption in/out
      finger.strength += (targetStrength - finger.strength) * 3.0 * dt;
      if (hasTarget) {
        // Smooth follow for disruption point
        finger.x += (mouse!.x - finger.x) * 6.0 * dt;
        finger.y += (mouse!.y - finger.y) * 6.0 * dt;
      }

      // ── Pre-compute drifting blob positions for this frame ──
      const blobPositions: { bx: number; by: number; r: number; g: number; b: number; rad: number }[] = [];
      const blend = c * c * (3 - 2 * c); // smoothstep for muted→neon

      for (const blob of COLOR_BLOBS) {
        // Orbit: elliptical path around center, drift speed increases with chaos
        const speedMul = 1 + c * 2.5; // faster drift during chaos
        const t = time * blob.speed * speedMul + blob.phase;
        // Add secondary wobble for organic feel
        const wobbleX = Math.sin(t * 1.7 + blob.phase * 3) * 0.06;
        const wobbleY = Math.cos(t * 2.3 + blob.phase * 2) * 0.05;
        const bx = blob.cx + Math.cos(t) * blob.rx + wobbleX;
        const by = blob.cy + Math.sin(t * 0.7 + 0.3) * blob.ry + wobbleY;

        // Blend color between muted and neon
        const r = blob.muted[0] + (blob.neon[0] - blob.muted[0]) * blend;
        const g = blob.muted[1] + (blob.neon[1] - blob.muted[1]) * blend;
        const b = blob.muted[2] + (blob.neon[2] - blob.muted[2]) * blend;

        // Blob influence radius — expands slightly during chaos for more overlap
        const rad = blob.radius + c * 0.15;

        blobPositions.push({ bx, by, r, g, b, rad });
      }

      for (let py = 0; py < RES_H; py++) {
        for (let px = 0; px < RES_W; px++) {
          const nx = px / RES_W; // normalised
          const ny = py / RES_H;

          // Sum all wave heights at this point
          let height = 0;

          // Calm source — origin driven by spring physics
          const calmDist = Math.hypot(nx - cx, ny - cy);
          const calmH =
            Math.sin(
              calmDist * CALM_SOURCE.frequency * RES_W -
              time * CALM_SOURCE.speed +
              CALM_SOURCE.phase
            ) *
            CALM_SOURCE.amplitude *
            (1 - c * 0.6); // calm wave dims during chaos
          height += calmH;

          // Track per-source contributions for blur variation
          let chaosContrib = 0;

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
            const attenuation = Math.max(0.06, 1 - dist * 1.25);
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
            chaosContrib += Math.abs(h);
          }

          // ── Finger-in-water disruption ──
          // Near the mouse: dampen waves (dead zone) + add secondary ripples
          if (finger.strength > 0.01) {
            const fdist = Math.hypot(nx - finger.x, ny - finger.y);
            const radius = 0.08; // disruption radius (normalised)
            // Smooth falloff: 1 at edge, 0 at center of finger
            const block = Math.max(0, 1 - fdist / radius);
            const blockSmooth = block * block; // quadratic for soft edges
            // Dampen original waves under the finger
            height *= 1 - blockSmooth * finger.strength * 0.92;
            // Add secondary scattered ripples radiating from finger
            const scatter = Math.sin(fdist * 0.06 * RES_W - time * 2.4) *
              0.35 * finger.strength *
              Math.max(0, 1 - fdist * 3.0); // fade with distance from finger
            height += scatter;
          }

          // Map height to colour — lime green with alpha from wave height
          const normalised = (height + 1.5) / 3.0; // 0–1 range (rough)
          const clamped = Math.max(0, Math.min(1, normalised));

          // ── Variable ring blur ──
          // Base sharpness decreases with chaos
          const baseSharpness = 1 - c * 0.55;
          // Distance from calm center softens rings
          const distFromCenter = Math.hypot(nx - cx, ny - cy);
          const distBlur = Math.max(0, 1 - distFromCenter * 1.8);
          // Chaos wave interference creates local blur zones
          const localChaosBlur = Math.min(1, chaosContrib * 0.7);
          // Combine: sharp near center when calm, blurry where chaos waves overlap
          const effectiveSharpness = baseSharpness *
            (0.12 + distBlur * 0.88) *
            (1 - localChaosBlur * 0.6);

          // Ring frequency varies: more rings during chaos for denser pattern
          const ringFreq = 4 + c * 4.5;
          // Power controls how "thin" the bright lines are
          const ringPower = 0.4 + effectiveSharpness * 2.0;
          const ringed =
            Math.pow(
              Math.abs(Math.sin(clamped * Math.PI * ringFreq)),
              ringPower
            );

          // ── Drifting blob color mixing ──
          // Accumulate color from all blobs weighted by proximity
          let totalWeight = 0;
          let mixR = 0, mixG = 0, mixB = 0;

          for (const blob of blobPositions) {
            const dx = nx - blob.bx;
            const dy = ny - blob.by;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Soft gaussian-like falloff
            const falloff = dist / blob.rad;
            // Cubic falloff for smoother blending than linear
            const w = Math.max(0, 1 - falloff * falloff);
            const weight = w * w; // quartic = very soft edges

            if (weight < 0.001) continue;

            mixR += blob.r * weight;
            mixG += blob.g * weight;
            mixB += blob.b * weight;
            totalWeight += weight;
          }

          // Normalize and add a subtle base tint so no pixel is pure black
          if (totalWeight > 0.001) {
            mixR /= totalWeight;
            mixG /= totalWeight;
            mixB /= totalWeight;
          } else {
            // Fallback: gentle neutral
            mixR = 160; mixG = 165; mixB = 175;
          }

          const idx = (py * RES_W + px) * 4;

          buf[idx]     = Math.round(mixR);
          buf[idx + 1] = Math.round(mixG);
          buf[idx + 2] = Math.round(mixB);
          // Alpha: rings modulate visibility, slight base alpha so color field is always gently visible
          const baseAlpha = 0.08 + c * 0.04; // subtle wash even without rings
          const ringAlpha = ringed * (0.18 + c * 0.10);
          buf[idx + 3] = Math.round(Math.min(1, baseAlpha + ringAlpha) * 255);
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
