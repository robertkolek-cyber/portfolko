"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Light sheer curtain billowing in a gentle breeze.
 * breeze: 0 = still, 1 = strong wind
 * Warm tints: cream, peach, amber, soft gold
 */

export default function CurtainBreeze({
  breeze,
  className,
  mousePosRef,
}: {
  breeze: number;
  className?: string;
  mousePosRef?: MutableRefObject<{ x: number; y: number } | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const breezeRef = useRef(breeze);
  breezeRef.current = breeze;

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

    // Simple hash-based noise for organic movement
    const hash = (x: number, y: number) => {
      const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return h - Math.floor(h);
    };

    // Smooth noise interpolation
    const smoothNoise = (x: number, y: number) => {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const fx = x - ix;
      const fy = y - iy;
      // Smoothstep
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);

      const n00 = hash(ix, iy);
      const n10 = hash(ix + 1, iy);
      const n01 = hash(ix, iy + 1);
      const n11 = hash(ix + 1, iy + 1);

      const nx0 = n00 + (n10 - n00) * sx;
      const nx1 = n01 + (n11 - n01) * sx;
      return nx0 + (nx1 - nx0) * sy;
    };

    // Layered noise
    const fbm = (x: number, y: number, octaves: number) => {
      let val = 0;
      let amp = 0.5;
      let freq = 1;
      for (let i = 0; i < octaves; i++) {
        val += smoothNoise(x * freq, y * freq) * amp;
        amp *= 0.5;
        freq *= 2;
      }
      return val;
    };

    const draw = () => {
      const dt = 0.016;
      time += dt;
      const b = breezeRef.current;

      // Mouse interaction — curtain pushes away from cursor
      const mouse = mousePosRef?.current;

      // Number of vertical curtain folds
      const foldCount = 8;
      const foldWidth = 1.0 / foldCount;

      for (let py = 0; py < RES_H; py++) {
        for (let px = 0; px < RES_W; px++) {
          const nx = px / RES_W; // 0-1
          const ny = py / RES_H; // 0-1

          // ── Curtain fold structure ──
          // Each fold is a sine wave — creates the vertical drape lines
          const foldPhase = nx / foldWidth * Math.PI * 2;

          // Breeze displaces folds horizontally with varying speed by height
          // Top is more anchored, bottom swings more
          const hangFactor = ny * ny; // quadratic — top barely moves, bottom flows
          const breezeSpeed = 0.6 + b * 1.8;
          const breezeAmp = (0.03 + b * 0.12) * hangFactor;

          // Organic breeze — layered sine waves at different frequencies
          const wind1 = Math.sin(time * breezeSpeed + ny * 2.0) * breezeAmp;
          const wind2 = Math.sin(time * breezeSpeed * 0.7 + ny * 3.5 + 1.3) * breezeAmp * 0.5;
          const wind3 = Math.sin(time * breezeSpeed * 1.4 + ny * 1.2 + nx * 2.0) * breezeAmp * 0.3;

          // Noise-driven turbulence for organic feel
          const turbulence = fbm(
            nx * 3.0 + time * 0.15 * (1 + b),
            ny * 2.0 + time * 0.08,
            3
          ) * 0.04 * (1 + b * 2) * hangFactor;

          const totalDisplacement = wind1 + wind2 + wind3 + turbulence;

          // Mouse push — curtain billows away from cursor
          let mousePush = 0;
          if (mouse) {
            const mdx = nx - mouse.x;
            const mdy = ny - mouse.y;
            const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
            const pushRadius = 0.15;
            if (mDist < pushRadius) {
              const pushStrength = (1 - mDist / pushRadius);
              mousePush = pushStrength * pushStrength * 0.08 * hangFactor;
            }
          }

          // Displaced fold position
          const displacedX = nx + totalDisplacement + mousePush;
          const foldVal = Math.sin(displacedX / foldWidth * Math.PI * 2);

          // ── Fabric shading ──
          // Fold depth: peaks are bright (facing light), valleys are shadowed
          // Light comes from upper-left
          const foldDepth = (foldVal + 1) * 0.5; // 0-1
          const foldShading = 0.55 + foldDepth * 0.45; // 0.55 to 1.0

          // Vertical drape shadow — subtle darkening toward bottom
          const verticalGrad = 1.0 - ny * 0.15;

          // ── Light through fabric — warm glow ──
          // Sheer fabric transmits light — brighter where stretched thin
          const stretch = Math.abs(Math.cos(displacedX / foldWidth * Math.PI * 2));
          const translucency = stretch * stretch * 0.3;

          // ── Warm color palette ──
          // Base: warm cream/ivory
          const baseR = 245;
          const baseG = 235;
          const baseB = 220;

          // Warm tint that shifts subtly across the fabric
          const warmShift = fbm(
            nx * 2.0 + time * 0.05,
            ny * 1.5 - time * 0.03,
            2
          );

          // Peach / amber / gold tints
          const tintR = 12 * warmShift + 5;    // push toward peach
          const tintG = -8 * warmShift;         // slightly less green in warm areas
          const tintB = -20 * warmShift - 10;   // reduce blue for warmth

          // Combine shading
          const shade = foldShading * verticalGrad;

          let r = (baseR + tintR) * shade + translucency * 40;
          let g = (baseG + tintG) * shade + translucency * 30;
          let bVal = (baseB + tintB) * shade + translucency * 15;

          // Subtle highlight on fold peaks — warm specular
          const specular = Math.pow(Math.max(0, foldDepth - 0.6) / 0.4, 3) * 0.15;
          r += specular * 60;
          g += specular * 45;
          bVal += specular * 25;

          // ── Fabric texture — very fine noise ──
          const texNoise = hash(px * 0.7 + time * 0.5, py * 0.7) * 0.03 - 0.015;
          r += texNoise * 255;
          g += texNoise * 255;
          bVal += texNoise * 255;

          const idx = (py * RES_W + px) * 4;
          buf[idx]     = Math.round(Math.max(0, Math.min(255, r)));
          buf[idx + 1] = Math.round(Math.max(0, Math.min(255, g)));
          buf[idx + 2] = Math.round(Math.max(0, Math.min(255, bVal)));

          // Alpha — fabric is semi-sheer, more opaque in folds, more transparent when stretched
          const foldOpacity = 0.6 + foldDepth * 0.35;
          const sheerOpacity = 1.0 - translucency * 0.5;
          const alpha = foldOpacity * sheerOpacity * (0.75 + b * 0.15);
          buf[idx + 3] = Math.round(Math.min(255, alpha * 255));
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
