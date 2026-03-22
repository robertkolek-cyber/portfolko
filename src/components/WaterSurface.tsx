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
  { x: 0.20, y: 0.25, frequency: 0.032, amplitude: 0.55, speed: 1.4, phase: 0.0 },
  { x: 0.80, y: 0.20, frequency: 0.028, amplitude: 0.50, speed: 1.7, phase: 1.8 },
  { x: 0.25, y: 0.75, frequency: 0.035, amplitude: 0.45, speed: 1.2, phase: 3.2 },
  { x: 0.75, y: 0.70, frequency: 0.030, amplitude: 0.50, speed: 1.5, phase: 4.8 },
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
            // Wave attenuates with distance — stronger falloff for cleaner look
            const attenuation = Math.max(0.05, 1 - dist * 1.4);
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

          // During calm: thin bright rings on dark bg (high contrast)
          // During chaos: dense bright soup
          const ringSharpness = 1 - c * 0.5;
          // Rings blur with distance from centre — sharp core, soft edges
          const distFromCenter = Math.hypot(nx - cx, ny - cy);
          const distBlur = Math.max(0, 1 - distFromCenter * 1.8); // 1 at centre, 0 at ~0.55
          const effectiveSharpness = ringSharpness * (0.15 + distBlur * 0.85);
          // Sharpen to rings by applying a soft threshold
          const ringed =
            Math.pow(
              Math.abs(Math.sin(clamped * Math.PI * (4 + c * 3))),
              0.5 + effectiveSharpness * 1.5
            );

          const idx = (py * RES_W + px) * 4;

          // 5 colours that slowly rotate around the canvas corners
          const corners = [
            [220, 160, 200],  // dusty pink
            [170, 190, 230],  // pale grey-blue
            [150, 210, 245],  // light blue
            [75,  90,  200],  // deep indigo
            [180, 160, 220],  // lavender
          ];

          // Slow rotation angle — colors drift around corners over time
          const rotSpeed = 0.06;
          const angle = time * rotSpeed;
          // Fractional offset determines which corner gets which color
          const shift = ((angle % (Math.PI * 2)) / (Math.PI * 2)); // 0–1

          // Pick interpolated corner colors based on shift
          const nColors = corners.length;
          const pick = (idx0: number) => {
            const f = (idx0 + shift * nColors) % nColors;
            const i0 = Math.floor(f) % nColors;
            const i1 = (i0 + 1) % nColors;
            const t = f - Math.floor(f);
            return [
              corners[i0][0] + (corners[i1][0] - corners[i0][0]) * t,
              corners[i0][1] + (corners[i1][1] - corners[i0][1]) * t,
              corners[i0][2] + (corners[i1][2] - corners[i0][2]) * t,
            ];
          };

          const tl = pick(0); // top-left
          const tr = pick(1); // top-right
          const br = pick(2); // bottom-right
          const bl = pick(3); // bottom-left

          // Bilinear interpolation across canvas position
          const topR = tl[0] + (tr[0] - tl[0]) * nx;
          const topG = tl[1] + (tr[1] - tl[1]) * nx;
          const topB = tl[2] + (tr[2] - tl[2]) * nx;
          const botR = bl[0] + (br[0] - bl[0]) * nx;
          const botG = bl[1] + (br[1] - bl[1]) * nx;
          const botB = bl[2] + (br[2] - bl[2]) * nx;

          const baseR = topR + (botR - topR) * ny;
          const baseG = topG + (botG - topG) * ny;
          const baseB = topB + (botB - topB) * ny;

          // Chaos deepens colors toward indigo
          buf[idx]     = Math.round(baseR + (75 - baseR) * c * 0.4);
          buf[idx + 1] = Math.round(baseG + (90 - baseG) * c * 0.4);
          buf[idx + 2] = Math.round(baseB + (200 - baseB) * c * 0.4);
          buf[idx + 3] = Math.round(ringed * (0.22 + c * 0.08) * 255);
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
