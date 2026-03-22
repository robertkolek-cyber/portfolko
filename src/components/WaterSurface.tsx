"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Top-down water surface — realistic caustic-like light patterns.
 * chaos=0: calm pool, gentle concentric ripples, cool sky-blue tones
 * chaos=1: choppy water with sunrise reflections (peach, coral, gold, amber)
 */

interface WaveSource {
  x: number;
  y: number;
  frequency: number;
  amplitude: number;
  speed: number;
  phase: number;
}

// Multiple wave sources at different scales for realistic interference
const CHAOS_SOURCES: WaveSource[] = [
  { x: 0.19, y: 0.25, frequency: 0.035, amplitude: 0.58, speed: 1.5, phase: 0.0 },
  { x: 0.79, y: 0.19, frequency: 0.030, amplitude: 0.52, speed: 1.8, phase: 1.6 },
  { x: 0.23, y: 0.73, frequency: 0.032, amplitude: 0.50, speed: 1.3, phase: 0.8 },
  { x: 0.80, y: 0.65, frequency: 0.038, amplitude: 0.48, speed: 1.4, phase: 3.5 },
  // Extra fine-detail sources for realistic texture
  { x: 0.50, y: 0.40, frequency: 0.055, amplitude: 0.25, speed: 2.2, phase: 2.0 },
  { x: 0.35, y: 0.55, frequency: 0.048, amplitude: 0.20, speed: 1.9, phase: 4.1 },
];

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

    const RES_W = 320;
    const RES_H = 200;
    canvas.width = RES_W;
    canvas.height = RES_H;
    ctx.imageSmoothingEnabled = true;

    const imageData = ctx.createImageData(RES_W, RES_H);
    const buf = imageData.data;

    let time = 0;
    const finger = { x: -1, y: -1, strength: 0 };

    const draw = () => {
      const dt = 0.016;
      time += dt;
      const c = chaosRef.current;
      const blend = c * c * (3 - 2 * c); // smoothstep for color

      const cx = CALM_SOURCE.x;
      const cy = CALM_SOURCE.y;

      // Mouse disruption
      const mouse = mousePosRef?.current;
      const hasTarget = mouse !== null && mouse !== undefined;
      const targetStrength = hasTarget ? (1 - c) * (1 - c) : 0;
      finger.strength += (targetStrength - finger.strength) * 3.0 * dt;
      if (hasTarget) {
        finger.x += (mouse!.x - finger.x) * 6.0 * dt;
        finger.y += (mouse!.y - finger.y) * 6.0 * dt;
      }

      for (let py = 0; py < RES_H; py++) {
        for (let px = 0; px < RES_W; px++) {
          const nx = px / RES_W;
          const ny = py / RES_H;

          // ── Wave height computation ──
          let height = 0;

          // Calm concentric ripples
          const calmDist = Math.hypot(nx - cx, ny - cy);
          const calmH =
            Math.sin(
              calmDist * CALM_SOURCE.frequency * RES_W -
              time * CALM_SOURCE.speed +
              CALM_SOURCE.phase
            ) *
            CALM_SOURCE.amplitude *
            (1 - c * 0.6);
          height += calmH;

          // Second harmonic for calm — subtler ring detail
          height += Math.sin(
            calmDist * CALM_SOURCE.frequency * RES_W * 2.3 -
            time * CALM_SOURCE.speed * 0.7 + 1.2
          ) * 0.25 * (1 - c * 0.8);

          // Chaos sources with distance-based attenuation
          for (let i = 0; i < CHAOS_SOURCES.length; i++) {
            const src = CHAOS_SOURCES[i];
            const threshold = (i / CHAOS_SOURCES.length) * 0.7;
            const intensity = Math.max(0, Math.min(1, (c - threshold) / 0.35));
            if (intensity < 0.01) continue;

            const dist = Math.hypot(nx - src.x, ny - src.y);
            // Realistic: waves attenuate with 1/sqrt(distance)
            const attenuation = 1 / (1 + dist * 2.5);
            const h =
              Math.sin(dist * src.frequency * RES_W - time * src.speed + src.phase) *
              src.amplitude * intensity * attenuation;
            height += h;

            // Add second harmonic for richer interference
            height += Math.sin(
              dist * src.frequency * RES_W * 1.7 - time * src.speed * 1.3 + src.phase + 0.8
            ) * src.amplitude * 0.3 * intensity * attenuation;
          }

          // Finger-in-water disruption
          if (finger.strength > 0.01) {
            const fdist = Math.hypot(nx - finger.x, ny - finger.y);
            const radius = 0.08;
            const block = Math.max(0, 1 - fdist / radius);
            const blockSmooth = block * block;
            height *= 1 - blockSmooth * finger.strength * 0.92;
            const scatter = Math.sin(fdist * 0.06 * RES_W - time * 2.4) *
              0.35 * finger.strength * Math.max(0, 1 - fdist * 3.0);
            height += scatter;
          }

          // ── Caustic pattern — mimics light refracting through water ──
          const normalised = (height + 2.0) / 4.0;
          const clamped = Math.max(0, Math.min(1, normalised));

          // Caustic brightness: bright where waves focus light, dark in troughs
          // Use absolute value of derivative-like pattern for caustic focusing
          const causticRaw = Math.abs(Math.sin(clamped * Math.PI * (3 + c * 2)));
          // Sharpen caustics: real water has tight bright lines, broad dark areas
          const causticSharp = Math.pow(causticRaw, 1.8 - c * 0.6);

          // Second caustic layer at different scale — more organic
          const caustic2 = Math.abs(Math.sin(clamped * Math.PI * (5 + c * 1.5) + 1.3));
          const caustic2Sharp = Math.pow(caustic2, 2.2 - c * 0.5);

          // Blend two caustic layers for realistic net-like pattern
          const caustic = causticSharp * 0.6 + caustic2Sharp * 0.4;

          // Distance from center affects ring visibility
          const distFromCenter = Math.hypot(nx - cx, ny - cy);
          const distFade = Math.max(0, 1 - distFromCenter * 1.5);
          // In calm: rings visible near center; in chaos: caustics everywhere
          const visibility = caustic * (c * 0.7 + distFade * (1 - c * 0.5) * 0.8);

          // ── Color: sunrise gradient for chaos, cool sky-blue for calm ──
          const idx = (py * RES_W + px) * 4;

          // Sunrise palette positioned spatially (warm at top/center, deeper at edges)
          // Vertical gradient: top = golden/peach, bottom = deeper coral/rose
          // Horizontal: center warm, edges cooler
          const sunriseR = 255;
          const sunriseG = 140 + (1 - ny) * 70 + nx * 20;  // golden top, coral bottom
          const sunriseB = 60 + (1 - ny) * 50 - nx * 20;   // warm everywhere

          // Cool sky-blue calm colors
          const calmR = 168 + distFromCenter * 20;
          const calmG = 185 + distFromCenter * 10;
          const calmB = 220 - distFromCenter * 10;

          // Blend calm → sunrise
          const r = calmR + (sunriseR - calmR) * blend;
          const g = calmG + (sunriseG - calmG) * blend;
          const b = calmB + (sunriseB - calmB) * blend;

          buf[idx]     = Math.round(Math.min(255, r));
          buf[idx + 1] = Math.round(Math.min(255, Math.max(0, g)));
          buf[idx + 2] = Math.round(Math.min(255, Math.max(0, b)));

          // Alpha: caustic pattern + gentle base wash
          const baseAlpha = 0.06 + c * 0.03;
          const causticAlpha = visibility * (0.20 + c * 0.12);
          buf[idx + 3] = Math.round(Math.min(1, baseAlpha + causticAlpha) * 255);
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
