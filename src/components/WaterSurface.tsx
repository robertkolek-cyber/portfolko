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

          // ── Layer 1: Ring pattern (existing, refined) ──
          const normalised = (height + 1.5) / 3.0;
          const clamped = Math.max(0, Math.min(1, normalised));

          const ringSharpness = 1 - c * 0.5;
          const distFromCenter = Math.hypot(nx - cx, ny - cy);
          const distBlur = Math.max(0, 1 - distFromCenter * 1.8);
          const effectiveSharpness = ringSharpness * (0.15 + distBlur * 0.85);
          const ringed =
            Math.pow(
              Math.abs(Math.sin(clamped * Math.PI * (4 + c * 3.5))),
              0.5 + effectiveSharpness * 1.5
            );

          // ── Layer 2: Caustic light focusing ──
          // Two wave fields at offset frequencies — where both align, light concentrates
          const caustic1 = Math.sin(clamped * Math.PI * 6.5 + time * 0.3);
          const caustic2 = Math.sin(clamped * Math.PI * 4.2 - time * 0.2 + nx * 3.0 + ny * 2.0);
          // Product creates the classic "net" / web pattern of real caustics
          const causticRaw = (caustic1 * caustic2 + 1) * 0.5; // 0–1
          // Sharp bright lines, broad dark areas — like real refracted light
          const caustic = Math.pow(causticRaw, 0.4) * 0.35;

          // ── Layer 3: Specular highlights on wave crests ──
          // "Light source" from upper-right — bright where wave peaks face the light
          // Approximate surface normal from height gradient
          // Cheap gradient: re-use height with small offset via sin perturbation
          const dhdx = Math.cos(clamped * Math.PI * 5.0 + nx * 8.0) * height * 0.3;
          const dhdy = Math.cos(clamped * Math.PI * 4.3 + ny * 7.0) * height * 0.25;
          // Dot product with light direction (upper-right, slightly toward viewer)
          const lightX = 0.4, lightY = -0.3;
          const spec = Math.max(0, dhdx * lightX + dhdy * lightY);
          // Raise to power for tight, bright highlights
          const specular = Math.pow(spec, 3.0) * 0.6;

          // ── Layer 4: Depth glow — subtle light-from-above brightness ──
          // Brighter at top, dimmer at bottom — like light entering water
          const depthGlow = (1 - ny * 0.3) * 0.08 * (1 + c * 0.5);

          const idx = (py * RES_W + px) * 4;

          // ── Color palette (unchanged) ──
          const muted = [
            [178, 172, 210],
            [158, 190, 225],
            [165, 198, 215],
            [168, 175, 220],
            [182, 188, 210],
          ];
          // Storm palette (complexity / chaos) — dark navy sea
          const vivid = [
            [18, 25, 55],     // deep navy
            [25, 40, 72],     // dark steel blue
            [15, 35, 60],     // midnight blue
            [30, 28, 65],     // dark indigo
            [20, 45, 58],     // stormy teal
          ];
          const blend = c * c * (3 - 2 * c);
          const corners = muted.map((m, i) => [
            m[0] + (vivid[i][0] - m[0]) * blend,
            m[1] + (vivid[i][1] - m[1]) * blend,
            m[2] + (vivid[i][2] - m[2]) * blend,
          ]);

          const rotSpeed = 0.06 + c * 0.6;
          const angle = time * rotSpeed;
          const shift = ((angle % (Math.PI * 2)) / (Math.PI * 2));

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

          const tl = pick(0);
          const tr = pick(1);
          const br = pick(2);
          const bl = pick(3);

          const topR = tl[0] + (tr[0] - tl[0]) * nx;
          const topG = tl[1] + (tr[1] - tl[1]) * nx;
          const topB = tl[2] + (tr[2] - tl[2]) * nx;
          const botR = bl[0] + (br[0] - bl[0]) * nx;
          const botG = bl[1] + (br[1] - bl[1]) * nx;
          const botB = bl[2] + (br[2] - bl[2]) * nx;

          let baseR = topR + (botR - topR) * ny;
          let baseG = topG + (botG - topG) * ny;
          let baseB = topB + (botB - topB) * ny;

          // ── Compose: specular + caustic brighten the base color toward white ──
          const highlight = Math.min(1, specular + caustic * (0.5 + c * 0.5));
          baseR = baseR + (255 - baseR) * highlight;
          baseG = baseG + (255 - baseG) * highlight;
          baseB = baseB + (255 - baseB) * highlight;

          buf[idx]     = Math.round(Math.min(255, baseR));
          buf[idx + 1] = Math.round(Math.min(255, baseG));
          buf[idx + 2] = Math.round(Math.min(255, baseB));

          // Alpha: ring pattern + caustic brightening + depth glow
          const ringAlpha = ringed * (0.22 + c * 0.095);
          const causticAlpha = caustic * (0.12 + c * 0.08);
          buf[idx + 3] = Math.round(Math.min(1, ringAlpha + causticAlpha + depthGlow) * 255);
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
