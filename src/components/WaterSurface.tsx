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

    // Spring-damper state for the calm source position
    // Gives the ripple origin weight and inertia — it drifts, overshoots, settles
    const spring = {
      x: CALM_SOURCE.x, y: CALM_SOURCE.y,  // current position
      vx: 0, vy: 0,                         // velocity
      influence: 0,                          // 0–1: how much mouse matters vs default center
    };

    // Spring constants — tuned for "water has mass" feel
    const STIFFNESS = 2.2;   // pull toward target (lower = lazier)
    const DAMPING = 3.8;     // friction (higher = less overshoot)
    const INFLUENCE_RATE = 0.6; // how fast mouse influence ramps in/out per second

    // Keep the origin from drifting too far to edges (rings stay readable)
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    const draw = () => {
      const dt = 0.016;
      time += dt;
      const c = chaosRef.current;

      // ── Spring physics for calm source position ──

      // Target: mouse position when available, otherwise canvas center
      const mouse = mousePosRef?.current;
      const hasTarget = mouse !== null && mouse !== undefined;

      // Smoothly ramp influence — chaos suppresses it, mouse presence enables it
      // The (1 - c) factor means influence naturally fades during chaos
      // and only reaches full strength when chaos is fully settled
      const targetInfluence = hasTarget ? (1 - c) * (1 - c) : 0; // quadratic falloff with chaos
      const influenceDelta = targetInfluence - spring.influence;
      spring.influence += influenceDelta * INFLUENCE_RATE * dt * (influenceDelta > 0 ? 1 : 2.5);
      // Faster ramp-down when mouse leaves — feels like water releasing tension

      // Blend target between mouse and default center based on influence
      const targetX = hasTarget
        ? CALM_SOURCE.x + (clamp(mouse!.x, 0.12, 0.88) - CALM_SOURCE.x) * spring.influence
        : CALM_SOURCE.x;
      const targetY = hasTarget
        ? CALM_SOURCE.y + (clamp(mouse!.y, 0.12, 0.88) - CALM_SOURCE.y) * spring.influence
        : CALM_SOURCE.y;

      // Spring force: F = -k * displacement - damping * velocity
      const dx = spring.x - targetX;
      const dy = spring.y - targetY;
      const ax = -STIFFNESS * dx - DAMPING * spring.vx;
      const ay = -STIFFNESS * dy - DAMPING * spring.vy;

      spring.vx += ax * dt;
      spring.vy += ay * dt;
      spring.x += spring.vx * dt;
      spring.y += spring.vy * dt;

      // Soft clamp — don't let it escape the visible area even on overshoot
      spring.x = clamp(spring.x, 0.05, 0.95);
      spring.y = clamp(spring.y, 0.05, 0.95);

      const cx = spring.x;
      const cy = spring.y;

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
          // Rings blur with distance from centre — sharp core, soft edges
          const distFromCenter = Math.hypot(nx - cx, ny - cy);
          const distBlur = Math.max(0, 1 - distFromCenter * 1.8); // 1 at centre, 0 at ~0.55
          const effectiveSharpness = ringSharpness * (0.15 + distBlur * 0.85);
          // Sharpen to rings by applying a soft threshold
          const ringed =
            Math.pow(
              Math.abs(Math.sin(clamped * Math.PI * (4 + c * 8))),
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
          buf[idx + 3] = Math.round(ringed * (0.22 + c * 0.15) * 255);
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
