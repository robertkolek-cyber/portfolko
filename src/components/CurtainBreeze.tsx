"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Realistic sheer linen curtain with morning light.
 * Two panels parted in the center, hung from a rod.
 * Swipe triggers breeze gusts. Strong opening wind calms down.
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

  const swipeRef = useRef({
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    gusts: [] as {
      startTime: number;
      strength: number;
      dirX: number;
      originY: number;
    }[],
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

    const buf = ctx.createImageData(W, H);
    const data = buf.data;
    let time = 0;

    // ── Noise helpers ────────────────────────────────────────────
    const hash = (x: number, y: number) => {
      const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return h - Math.floor(h);
    };

    const smoothNoise = (x: number, y: number) => {
      const ix = Math.floor(x),
        iy = Math.floor(y);
      const fx = x - ix,
        fy = y - iy;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      return (
        hash(ix, iy) * (1 - sx) * (1 - sy) +
        hash(ix + 1, iy) * sx * (1 - sy) +
        hash(ix, iy + 1) * (1 - sx) * sy +
        hash(ix + 1, iy + 1) * sx * sy
      );
    };

    const fbm2 = (x: number, y: number) =>
      smoothNoise(x, y) * 0.5 + smoothNoise(x * 2.1, y * 2.1) * 0.25;

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
          const speed = Math.sqrt(
            vx * vx + ((my - sw.lastY) / dt) ** 2
          );
          if (speed > 1.2) {
            sw.gusts.push({
              startTime: time,
              strength: Math.min(1, (speed - 1.2) / 3.5),
              dirX: Math.sign(vx || 0.01),
              originY: my,
            });
            if (sw.gusts.length > 5) sw.gusts.shift();
          }
        }
      }
      sw.lastX = mx;
      sw.lastY = my;
      sw.lastTime = now;
    };
    canvas.addEventListener("mousemove", onMouseMove);

    // ── Fold profile constants ───────────────────────────────────
    // pow(abs(sin(phase)), EXP) — wide plateaus, narrow creases
    const EXP = 0.32;
    const FOLDS = 8;

    const draw = () => {
      time += 0.016;
      const b = breezeRef.current;
      const mouse = mousePosRef?.current;
      const sw = swipeRef.current;

      // ── Opening gust — strong start, exponential decay ─────────
      const openGust = Math.exp(-time * 0.65) * 0.85;
      const eff = b + openGust;

      // Prune expired gusts
      sw.gusts = sw.gusts.filter((g) => time - g.startTime < 2.8);

      // ── Edge peek parameters ───────────────────────────────────
      // The curtain doesn't cover the full width; edges reveal bg
      // Wind pulls edges back more
      const edgeBase = 0.07 + eff * 0.04;

      for (let py = 0; py < H; py++) {
        const ny = py / H;
        const hang = ny * ny;

        // ── Per-row wind ─────────────────────────────────────────
        const ws = 0.5 + eff * 1.5;
        const wa = (0.025 + eff * 0.09) * hang;
        const rw1 = Math.sin(time * ws + ny * 2.0) * wa;
        const rw2 =
          Math.sin(time * ws * 0.65 + ny * 3.3 + 1.3) * wa * 0.45;

        for (let ppx = 0; ppx < W; ppx++) {
          const nx = ppx / W;

          // ── Per-pixel wind ─────────────────────────────────────
          const w3 =
            Math.sin(time * ws * 1.3 + ny * 1.2 + nx * 2.5) *
            wa *
            0.25;
          let windDisp = rw1 + rw2 + w3;

          // Small organic turbulence (cheap 2-octave fbm)
          windDisp +=
            (fbm2(
              nx * 3 + time * 0.11 * (1 + eff),
              ny * 2 + time * 0.06
            ) -
              0.3) *
            0.025 *
            (1 + eff * 2) *
            hang;

          // ── Swipe gusts ────────────────────────────────────────
          for (const gust of sw.gusts) {
            const age = time - gust.startTime;
            const env =
              age < 0.15
                ? age / 0.15
                : Math.exp(-(age - 0.15) * 1.5);
            const yDist = ny - gust.originY;
            const yFall = Math.exp(-yDist * yDist * 6);
            const wave =
              Math.sin(age * 5 - ny * 3.5) * 0.5 + 0.5;
            windDisp +=
              gust.dirX *
              gust.strength *
              env *
              yFall *
              wave *
              0.14 *
              hang;
          }

          // ── Mouse proximity push ───────────────────────────────
          if (mouse) {
            const dist = Math.sqrt(
              (nx - mouse.x) ** 2 + (ny - mouse.y) ** 2
            );
            if (dist < 0.16) {
              windDisp +=
                (1 - dist / 0.16) ** 2 * 0.06 * hang;
            }
          }

          // ── Edge peek: organic fade at left/right borders ──────
          // Wind-responsive: stronger breeze → wider peek
          const edgeL =
            edgeBase +
            Math.sin(time * 0.45 + ny * 2.2) * 0.02 * hang * eff;
          const edgeR =
            edgeBase * 0.9 +
            Math.sin(time * 0.38 + ny * 1.8 + 1.5) *
              0.025 *
              hang *
              eff;

          let edgeAlpha = 1.0;
          if (nx < edgeL) {
            edgeAlpha = Math.pow(
              Math.max(0, nx / edgeL),
              1.8
            );
          } else if (nx > 1 - edgeR) {
            edgeAlpha = Math.pow(
              Math.max(0, (1 - nx) / edgeR),
              1.8
            );
          }

          // ── Bottom hem flutter ─────────────────────────────────
          const hemWave =
            Math.sin(time * 0.6 + nx * 4.5 + windDisp * 8) *
            0.02 *
            eff;
          const hemLine = 0.93 + hemWave;
          if (ny > hemLine) {
            edgeAlpha *= Math.max(
              0,
              1 - (ny - hemLine) / (1.0 - hemLine)
            );
          }

          // Top gather at rod
          if (ny < 0.025) edgeAlpha *= ny / 0.025;

          if (edgeAlpha < 0.008) {
            const idx = (py * W + ppx) * 4;
            data[idx] = data[idx + 1] = data[idx + 2] = data[idx + 3] = 0;
            continue;
          }

          // ── Fold profile ───────────────────────────────────────
          // Phase with warp for irregular fold spacing
          const basePhase =
            (nx + windDisp) * FOLDS * Math.PI;
          const warpedPhase =
            basePhase +
            Math.sin((nx + windDisp) * 5.17) * 0.45 +
            Math.sin((nx + windDisp) * 11.3 + 1.7) * 0.2;

          const absSin = Math.abs(Math.sin(warpedPhase));
          // pow(abs(sin), 0.32) → wide plateaus, narrow creases
          const foldDepth = Math.pow(absSin + 0.001, EXP);

          // Folds relax slightly toward bottom
          const foldIntensity = 1.0 - ny * 0.12;
          const fd = foldDepth * foldIntensity;

          // Crease shadow mask — narrow dark line at fold transitions
          const creaseMask = fd < 0.12 ? fd / 0.12 : 1.0;

          // ── Lighting ───────────────────────────────────────────
          // Ambient — warm, fills everything
          const ambient = 0.68;

          // Front light on fold ridges
          const frontLight = fd * 0.28;

          // Backlight through thin fabric (valleys, not creases)
          const thinness = 1 - fd;
          const backLight =
            thinness * thinness * 0.18 * creaseMask;

          // Sun gradient: brighter right side + slightly brighter top
          const sunGrad =
            0.88 + nx * 0.12 + (1 - ny) * 0.04;

          const totalLight =
            (ambient + frontLight + backLight) * sunGrad;

          // ── Color: warm linen whites ───────────────────────────
          // Subtle color variation across fabric
          const warmN =
            fbm2(nx * 2.2 + time * 0.03, ny * 1.6) * 3;

          let r = (250 + warmN) * totalLight;
          let g = (247 + warmN * 0.7) * totalLight;
          let bv = (240 - warmN * 0.5) * totalLight;

          // Backlight warmth — golden glow in thin areas
          const blGlow = backLight * sunGrad;
          r += blGlow * 30;
          g += blGlow * 18;
          bv += blGlow * 4;

          // Crease shadow — warm gray
          if (creaseMask < 1) {
            const shadow = 1 - creaseMask;
            r -= shadow * 25;
            g -= shadow * 23;
            bv -= shadow * 18;
          }

          // Rod shadow band at top
          if (ny < 0.04) {
            const rod = (1 - ny / 0.04) * 0.12;
            r *= 1 - rod;
            g *= 1 - rod;
            bv *= 1 - rod;
          }

          // Very fine fabric texture
          const tex =
            (hash(ppx + time * 0.15, py) - 0.5) * 2.5;
          r += tex;
          g += tex;
          bv += tex;

          // ── Alpha ──────────────────────────────────────────────
          // Ridges (bunched fabric) = more opaque
          // Valleys (thin, stretched) = more transparent
          const foldAlpha = 0.45 + fd * 0.45;
          const alpha =
            foldAlpha * edgeAlpha * (0.8 + eff * 0.1);

          const idx = (py * W + ppx) * 4;
          data[idx] =
            Math.max(0, Math.min(255, r)) | 0;
          data[idx + 1] =
            Math.max(0, Math.min(255, g)) | 0;
          data[idx + 2] =
            Math.max(0, Math.min(255, bv)) | 0;
          data[idx + 3] =
            (Math.max(0, Math.min(255, alpha * 255))) | 0;
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
