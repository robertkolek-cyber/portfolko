"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Sheer curtain billowing in a morning breeze.
 * - Starts with a strong gust that calms down
 * - Mouse swipes trigger new breeze bursts
 * - Edges peek open to reveal what's behind
 *
 * breeze: 0 = still, 1 = strong wind
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

  // Swipe detection — track mouse velocity
  const swipeRef = useRef({
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    // Active gusts triggered by swipes
    gusts: [] as { startTime: number; strength: number; dirX: number; originY: number }[],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 400;
    const H = 280;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = true;

    const buf = ctx.createImageData(W, H);
    const px = buf.data;

    let time = 0;

    // ── Noise ────────────────────────────────────────────────────
    const hash = (x: number, y: number) => {
      const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return h - Math.floor(h);
    };

    const smoothNoise = (x: number, y: number) => {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = x - ix, fy = y - iy;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      return (
        hash(ix, iy) * (1 - sx) * (1 - sy) +
        hash(ix + 1, iy) * sx * (1 - sy) +
        hash(ix, iy + 1) * (1 - sx) * sy +
        hash(ix + 1, iy + 1) * sx * sy
      );
    };

    const fbm = (x: number, y: number, oct: number) => {
      let v = 0, a = 0.5, f = 1;
      for (let i = 0; i < oct; i++) {
        v += smoothNoise(x * f, y * f) * a;
        a *= 0.5; f *= 2;
      }
      return v;
    };

    // ── Swipe listener ───────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const now = performance.now();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;
      const sw = swipeRef.current;

      if (sw.lastTime > 0) {
        const dt = (now - sw.lastTime) / 1000;
        if (dt > 0 && dt < 0.1) {
          const vx = (mx - sw.lastX) / dt;
          const vy = (my - sw.lastY) / dt;
          const speed = Math.sqrt(vx * vx + vy * vy);

          // Trigger gust if swipe is fast enough
          if (speed > 1.5) {
            const strength = Math.min(1, (speed - 1.5) / 4);
            sw.gusts.push({
              startTime: time,
              strength,
              dirX: Math.sign(vx),
              originY: my,
            });
            // Keep max 4 active gusts
            if (sw.gusts.length > 4) sw.gusts.shift();
          }
        }
      }

      sw.lastX = mx;
      sw.lastY = my;
      sw.lastTime = now;
    };

    canvas.addEventListener("mousemove", onMouseMove);

    // ── Fold config (8 folds, similar to original) ───────────────
    const FOLDS = 8;
    const foldW = 1.0 / FOLDS;

    const draw = () => {
      const dt = 0.016;
      time += dt;
      const b = breezeRef.current;
      const mouse = mousePosRef?.current;
      const sw = swipeRef.current;

      // ── Opening gust: strong at start, exponential decay ───────
      // Peaks around 0.8, fully calm by ~4s
      const openGust = Math.exp(-time * 0.8) * 0.9;

      // Effective breeze = base + opening gust
      const effBreeze = b + openGust;

      // ── Prune expired gusts ────────────────────────────────────
      sw.gusts = sw.gusts.filter(g => time - g.startTime < 2.5);

      for (let py = 0; py < H; py++) {
        const ny = py / H;
        const hang = ny * ny; // top pinned, bottom free

        for (let ppx = 0; ppx < W; ppx++) {
          const nx = ppx / W;

          // ── Edge peek: curtain doesn't cover full width ────────
          // Left and right edges pull back, revealing background
          // The amount varies with breeze — stronger wind = more peek
          const edgeLeft = 0.06 + effBreeze * 0.04 + Math.sin(time * 0.5 + ny * 2) * 0.02 * hang;
          const edgeRight = 0.06 + effBreeze * 0.03 + Math.sin(time * 0.4 + ny * 1.7 + 1.5) * 0.025 * hang;

          // Soft edge alpha mask — fade to transparent at sides
          let edgeAlpha = 1.0;
          if (nx < edgeLeft) {
            edgeAlpha = Math.pow(nx / edgeLeft, 1.5);
          } else if (nx > 1 - edgeRight) {
            edgeAlpha = Math.pow((1 - nx) / edgeRight, 1.5);
          }

          // Bottom edge also flutters and peeks
          const hemLine = 0.92 + Math.sin(time * 0.6 + nx * 4) * 0.03 * effBreeze - effBreeze * 0.02;
          if (ny > hemLine) {
            edgeAlpha *= Math.max(0, 1 - (ny - hemLine) / (1 - hemLine));
          }

          if (edgeAlpha < 0.005) {
            const idx = (py * W + ppx) * 4;
            px[idx] = px[idx + 1] = px[idx + 2] = px[idx + 3] = 0;
            continue;
          }

          // ── Wind displacement ──────────────────────────────────
          const breezeSpeed = 0.6 + effBreeze * 1.8;
          const breezeAmp = (0.03 + effBreeze * 0.12) * hang;

          const wind1 = Math.sin(time * breezeSpeed + ny * 2.0) * breezeAmp;
          const wind2 = Math.sin(time * breezeSpeed * 0.7 + ny * 3.5 + 1.3) * breezeAmp * 0.5;
          const wind3 = Math.sin(time * breezeSpeed * 1.4 + ny * 1.2 + nx * 2.0) * breezeAmp * 0.3;

          // Noise turbulence
          const turb = fbm(
            nx * 3.0 + time * 0.15 * (1 + effBreeze),
            ny * 2.0 + time * 0.08,
            3
          ) * 0.04 * (1 + effBreeze * 2) * hang;

          let totalDisp = wind1 + wind2 + wind3 + turb;

          // ── Swipe gusts ────────────────────────────────────────
          for (const gust of sw.gusts) {
            const age = time - gust.startTime;
            // Quick rise (0.2s), slow decay (2s)
            const envelope = age < 0.2
              ? age / 0.2
              : Math.exp(-(age - 0.2) * 1.8);
            // Gust spreads vertically from swipe origin
            const yDist = Math.abs(ny - gust.originY);
            const yFalloff = Math.exp(-yDist * yDist * 8);
            // Propagation wave
            const wave = Math.sin(age * 6 - ny * 4) * 0.5 + 0.5;
            totalDisp += gust.dirX * gust.strength * envelope * yFalloff * wave * 0.15 * hang;
          }

          // ── Mouse proximity push ──────────────────────────────
          if (mouse) {
            const mdx = nx - mouse.x;
            const mdy = ny - mouse.y;
            const dist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (dist < 0.15) {
              const push = Math.pow(1 - dist / 0.15, 2) * 0.08 * hang;
              totalDisp += push;
            }
          }

          // ── Fold shape ─────────────────────────────────────────
          const displacedX = nx + totalDisp;
          const foldPhase = displacedX / foldW * Math.PI * 2;
          const foldVal = Math.sin(foldPhase);
          const foldDepth = (foldVal + 1) * 0.5;

          // ── Shading ────────────────────────────────────────────
          const foldShading = 0.5 + foldDepth * 0.5;
          const vertGrad = 1.0 - ny * 0.15;

          // Light through fabric (stretch = thin = bright)
          const stretch = Math.abs(Math.cos(foldPhase));
          const translucency = stretch * stretch * 0.3;

          // ── Morning sunlight color ─────────────────────────────
          // Warm cream base
          let r = 245, g = 235, bv = 220;

          // Warm tint variation
          const warmN = fbm(nx * 2 + time * 0.05, ny * 1.5 - time * 0.03, 2);

          // Golden sun tint — stronger on right side (sun source)
          const sunFactor = (0.3 + nx * 0.7);
          r += 15 * warmN + 12 * sunFactor;
          g += 6 * warmN + 4 * sunFactor;
          bv += -12 * warmN - 10 * sunFactor;

          // Combine shading
          const shade = foldShading * vertGrad;
          r *= shade;
          g *= shade;
          bv *= shade;

          // Backlight glow (golden light through thin fabric)
          r += translucency * 50 * sunFactor;
          g += translucency * 30 * sunFactor;
          bv += translucency * 10;

          // Specular on fold peaks
          const spec = Math.pow(Math.max(0, foldDepth - 0.6) / 0.4, 3) * 0.15;
          r += spec * 70;
          g += spec * 50;
          bv += spec * 25;

          // Caustic dancing light
          const caustic = fbm(nx * 5 + time * 0.15 + totalDisp * 6, ny * 3.5 + time * 0.1, 2);
          const causticVal = Math.pow(Math.max(0, caustic - 0.38) * 2.5, 2) * sunFactor * stretch * 0.3;
          r += causticVal * 45;
          g += causticVal * 30;
          bv += causticVal * 8;

          // Fine texture
          const tex = (hash(ppx * 0.7 + time * 0.5, py * 0.7) - 0.5) * 5;
          r += tex; g += tex; bv += tex;

          // ── Alpha ──────────────────────────────────────────────
          const baseAlpha = 0.6 + foldDepth * 0.35;
          const sheerAlpha = 1.0 - translucency * 0.5;
          const alpha = baseAlpha * sheerAlpha * edgeAlpha * (0.75 + effBreeze * 0.15);

          const idx = (py * W + ppx) * 4;
          px[idx]     = Math.max(0, Math.min(255, r)) | 0;
          px[idx + 1] = Math.max(0, Math.min(255, g)) | 0;
          px[idx + 2] = Math.max(0, Math.min(255, bv)) | 0;
          px[idx + 3] = Math.max(0, Math.min(255, alpha * 255)) | 0;
        }
      }

      ctx.putImageData(buf, 0, 0);
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
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
