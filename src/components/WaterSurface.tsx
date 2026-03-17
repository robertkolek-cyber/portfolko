"use client";

import { useEffect, useRef } from "react";

/**
 * Morphing field visualization — generative flow field that transitions
 * from tangled chaos to clean geometric order.
 *
 * chaos=1: turbulent, tangled field lines with high-frequency noise
 * chaos=0: clean concentric rings radiating from center
 */

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

    const RES_W = 400;
    const RES_H = 280;
    canvas.width = RES_W;
    canvas.height = RES_H;
    ctx.imageSmoothingEnabled = true;

    const imageData = ctx.createImageData(RES_W, RES_H);
    const buf = imageData.data;

    let time = 0;

    // Precompute sin/cos tables for performance
    const TWO_PI = Math.PI * 2;

    const draw = () => {
      time += 0.012;
      const c = chaosRef.current;
      const invC = 1 - c;

      const cx = RES_W * 0.5;
      const cy = RES_H * 0.5;
      const maxDist = Math.hypot(cx, cy);

      for (let py = 0; py < RES_H; py++) {
        for (let px = 0; px < RES_W; px++) {
          const nx = px / RES_W;
          const ny = py / RES_H;

          const dx = px - cx;
          const dy = py - cy;
          const dist = Math.hypot(dx, dy);
          const normDist = dist / maxDist;

          // === ORDER: Clean concentric rings with subtle rotation ===
          const ringFreq = 0.06;
          const ringPhase = dist * ringFreq - time * 0.8;
          const ringVal = Math.sin(ringPhase) * 0.5 + 0.5;
          // Sharpen rings
          const ringSharp = Math.pow(ringVal, 2.5);

          // === CHAOS: Multi-frequency noise field ===
          // Simplex-like noise via layered sinusoids
          const n1 = Math.sin(nx * 12.5 + time * 1.3) * Math.cos(ny * 9.7 - time * 0.9);
          const n2 = Math.sin(nx * 23.1 - time * 2.1 + ny * 5.0) * Math.cos(ny * 17.3 + time * 1.7);
          const n3 = Math.sin((nx + ny) * 15.0 + time * 0.7) * Math.sin((nx - ny) * 11.0 - time * 1.1);
          const n4 = Math.sin(normDist * 20 + Math.atan2(dy, dx) * 3 - time * 2.5);
          const chaosVal = (n1 * 0.35 + n2 * 0.25 + n3 * 0.25 + n4 * 0.15) * 0.5 + 0.5;

          // === BLEND based on chaos parameter ===
          const fieldVal = ringSharp * invC + chaosVal * c;

          // Pulsing brightness based on field value
          const brightness = fieldVal;

          // Color: calm = soft cyan-blue, chaos = deeper electric blue
          const r = Math.round(100 + 80 * invC + brightness * (50 - 30 * c));
          const g = Math.round(160 + 60 * invC + brightness * (60 - 40 * c));
          const b = Math.round(220 + 35 * invC + brightness * (35 - 10 * c));

          // Alpha: rings are more transparent, chaos is denser
          const edgeFade = 1 - Math.pow(normDist, 1.5) * 0.6;
          const alpha = brightness * (0.12 + c * 0.14) * edgeFade;

          const idx = (py * RES_W + px) * 4;
          buf[idx] = Math.min(255, r);
          buf[idx + 1] = Math.min(255, g);
          buf[idx + 2] = Math.min(255, b);
          buf[idx + 3] = Math.round(alpha * 255);
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
