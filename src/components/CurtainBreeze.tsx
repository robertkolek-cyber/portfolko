"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Sheer linen curtain billowing in an asymmetric morning breeze.
 * Golden-hour sunlight pours through from the right, casting
 * warm caustics and volumetric glow through the translucent fabric.
 *
 * breeze: 0 = still, 1 = strong gust
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

    const W = 480;
    const H = 320;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = true;

    const buf = ctx.createImageData(W, H);
    const px = buf.data;

    let time = 0;

    // ── Noise primitives ─────────────────────────────────────────
    const hash = (x: number, y: number) => {
      const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return h - Math.floor(h);
    };
    const hash2 = (x: number, y: number) => {
      const h = Math.sin(x * 269.5 + y * 183.3) * 28947.7139;
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
        a *= 0.5; f *= 2.1;
      }
      return v;
    };

    // ── Per-fold personality (computed once) ──────────────────────
    // Asymmetric: each fold has its own width, phase offset, stiffness
    const FOLDS = 11;
    const foldCenter: number[] = [];
    const foldWidth: number[] = [];
    const foldPhaseOff: number[] = [];
    const foldStiffness: number[] = []; // how much it resists the wind
    const foldDepthBias: number[] = [];

    // Irregular fold positions — wider on left (near light), bunched on right
    {
      let cursor = 0;
      for (let i = 0; i < FOLDS; i++) {
        const baseW = 1.0 / FOLDS;
        // Vary width: left folds wider, right folds narrower + noise
        const widthVar = baseW * (0.7 + hash(i * 17.3, 42.1) * 0.65);
        foldWidth.push(widthVar);
        foldCenter.push(cursor + widthVar * 0.5);
        cursor += widthVar;
        foldPhaseOff.push(hash(i * 31.7, 88.3) * Math.PI * 2);
        foldStiffness.push(0.6 + hash(i * 53.1, 19.7) * 0.8);
        foldDepthBias.push(hash2(i * 7.3, 61.9) * 0.3 - 0.15);
      }
      // Normalize so they span 0–1
      const total = cursor;
      let c2 = 0;
      for (let i = 0; i < FOLDS; i++) {
        foldWidth[i] /= total;
        foldCenter[i] = c2 + foldWidth[i] * 0.5;
        c2 += foldWidth[i];
      }
    }

    // ── Sun direction (morning light from upper-right) ───────────
    const SUN_DIR_X = 0.65;
    const SUN_DIR_Y = -0.45;
    const SUN_NORM = Math.sqrt(SUN_DIR_X * SUN_DIR_X + SUN_DIR_Y * SUN_DIR_Y);

    const draw = () => {
      const dt = 0.016;
      time += dt;
      const b = breezeRef.current;
      const mouse = mousePosRef?.current;

      // ── Wind field: asymmetric, directional (from left-ish) ────
      // Two overlapping wave systems + noise gusts
      const windTime = time * (0.5 + b * 1.6);
      const gustPhase = Math.sin(time * 0.37) * 0.5 + 0.5; // slow gust cycle
      const gustStrength = gustPhase * gustPhase * b * 0.6;

      for (let py = 0; py < H; py++) {
        const ny = py / H;
        // Hang factor — top is pinned, bottom flows freely
        // Cubic for more dramatic bottom billow
        const hang = ny * ny * ny;
        const hangMid = ny * ny; // less extreme version for some effects

        for (let ppx = 0; ppx < W; ppx++) {
          const nx = ppx / W;

          // ── Asymmetric wind displacement ───────────────────────
          // Primary wave — slow, broad sweep from left
          const w1 = Math.sin(windTime * 0.8 + ny * 1.8 + nx * 0.4 + 0.0) * (0.04 + b * 0.14);
          // Secondary — faster, tighter, phase-shifted
          const w2 = Math.sin(windTime * 1.3 + ny * 3.2 - nx * 1.1 + 2.1) * (0.02 + b * 0.07);
          // Tertiary — very fast ripple, mostly at bottom
          const w3 = Math.sin(windTime * 2.1 + ny * 5.0 + nx * 2.8 + 4.7) * (0.01 + b * 0.04) * hang;
          // Gust — sudden, localized push
          const gustLocal = Math.sin(windTime * 0.6 + ny * 1.2 + nx * 3.0) * gustStrength * 0.08;

          // Noise turbulence — organic chaos
          const turb = (fbm(
            nx * 3.5 + time * 0.12 * (1 + b),
            ny * 2.5 + time * 0.07,
            3
          ) - 0.35) * 0.06 * (1 + b * 2.5) * hangMid;

          let totalWind = (w1 + w2 + w3 + gustLocal + turb) * hang;

          // ── Mouse push (asymmetric — fabric flows away) ────────
          if (mouse) {
            const mdx = nx - mouse.x;
            const mdy = ny - mouse.y;
            const dist = Math.sqrt(mdx * mdx + mdy * mdy);
            const radius = 0.18;
            if (dist < radius) {
              const strength = (1 - dist / radius);
              const push = strength * strength * strength * 0.12 * hang;
              // Push in the direction away from mouse, with downward bias
              totalWind += push * Math.sign(mdx || 0.01);
            }
          }

          // ── Vertical displacement (fabric lifts in gusts) ──────
          const liftWind = Math.sin(windTime * 0.7 + nx * 2.5) * gustStrength * 0.03 * hang;

          // ── Find which fold we're in and compute fold shape ─────
          const displacedX = nx + totalWind;
          let foldVal = 0;
          let foldIdx = 0;
          let localPos = 0; // 0-1 within the fold

          {
            let acc = 0;
            for (let fi = 0; fi < FOLDS; fi++) {
              if (displacedX < acc + foldWidth[fi] || fi === FOLDS - 1) {
                foldIdx = fi;
                localPos = (displacedX - acc) / foldWidth[fi];
                // Fold shape: not a pure sine — asymmetric curve
                // Left side of fold is steeper (facing sun), right is gentler
                const phase = localPos * Math.PI;
                const skew = 0.15 * Math.sin(foldPhaseOff[fi]); // each fold skews differently
                foldVal = Math.sin(phase + skew) * (0.8 + foldDepthBias[fi]);
                break;
              }
              acc += foldWidth[fi];
            }
          }

          const stiff = foldStiffness[foldIdx];
          // Dampen fold displacement by stiffness
          const dampedWind = totalWind * (1.0 / stiff);

          // ── Fabric surface normal (for lighting) ───────────────
          // Approximate normal from fold curvature + wind tilt
          const normalX = -foldVal * 0.6 - dampedWind * 3.0;
          const normalY = -0.3 + liftWind * 2.0;
          const normalZ = 1.0;
          const nLen = Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ);

          // ── Lighting ───────────────────────────────────────────
          // Dot product with sun direction
          const dot = (normalX * SUN_DIR_X + normalY * SUN_DIR_Y + normalZ * 0.6) / (nLen * SUN_NORM);
          const diffuse = Math.max(0, dot);

          // Fold depth shading — valleys are darker
          const foldDepth = (foldVal + 1) * 0.5; // 0-1
          const foldShade = 0.4 + foldDepth * 0.6;

          // ── Translucency / backlight ───────────────────────────
          // Where fabric is thin (stretched), morning light pours through
          const stretch = 1.0 - Math.abs(foldVal);
          const backlight = stretch * stretch * (0.15 + b * 0.15) * (0.5 + nx * 0.8);
          // Stronger on the right side (facing the sun source)

          // ── Subsurface scatter (warm glow through fabric) ──────
          const sss = Math.pow(stretch, 3) * 0.25 * (0.6 + nx * 0.6);

          // ── Specular — sharp glint on fold peaks ───────────────
          const halfVec = dot; // simplified
          const spec = Math.pow(Math.max(0, halfVec), 12) * 0.35 * foldDepth;

          // ── Color: warm linen base + golden sunlight ───────────
          // Base linen — slightly varies per fold for realism
          const linenVar = hash(foldIdx * 13.7 + 5.1, 0) * 6;
          let baseR = 242 + linenVar;
          let baseG = 233 + linenVar * 0.7;
          let baseB = 218 - linenVar * 0.3;

          // Warm color shift from noise (subtle life in the fabric)
          const warmN = fbm(nx * 2.5 + time * 0.04, ny * 1.8 - time * 0.025, 2);

          // Morning sun tint — golden/amber, stronger on right side
          const sunTintStrength = (0.3 + nx * 0.7) * (0.6 + diffuse * 0.4);
          const sunR = 30 * sunTintStrength;
          const sunG = 12 * sunTintStrength;
          const sunB = -15 * sunTintStrength;

          // Combine all lighting
          const shade = foldShade * (0.7 + diffuse * 0.5);

          let r = (baseR + warmN * 8 + sunR) * shade;
          let g = (baseG + warmN * 4 + sunG) * shade;
          let bv = (baseB - warmN * 6 + sunB) * shade;

          // Add backlight (golden light through fabric)
          r += backlight * 90;
          g += backlight * 55;
          bv += backlight * 15;

          // Add SSS (warm orange glow)
          r += sss * 60;
          g += sss * 30;
          bv += sss * 5;

          // Specular highlight (bright warm)
          r += spec * 80;
          g += spec * 65;
          bv += spec * 40;

          // ── Vertical gradient: slight darkening at bottom ──────
          const vGrad = 1.0 - ny * 0.12;
          r *= vGrad;
          g *= vGrad;
          bv *= vGrad;

          // ── Sunbeam caustics — dancing light patches ───────────
          // Simulates refracted light patterns on the fabric
          const caustic = fbm(
            nx * 6.0 + time * 0.18 + totalWind * 8,
            ny * 4.0 + time * 0.12,
            2
          );
          const causticMask = Math.pow(Math.max(0, caustic - 0.35) * 2.5, 2);
          const causticStrength = causticMask * (0.2 + nx * 0.4) * (0.5 + b * 0.5) * stretch;
          r += causticStrength * 55;
          g += causticStrength * 40;
          bv += causticStrength * 12;

          // ── Fine fabric texture ────────────────────────────────
          const tex = (hash(ppx * 0.8 + time * 0.3, py * 0.8) - 0.5) * 4;
          r += tex;
          g += tex;
          bv += tex;

          // ── Alpha: sheer fabric, more see-through when stretched ─
          const baseAlpha = 0.55 + foldDepth * 0.4;
          const stretchAlpha = 1.0 - stretch * stretch * 0.35;
          // Edges are softer (feathered hem at bottom)
          const hemFade = ny > 0.88 ? 1.0 - (ny - 0.88) / 0.12 : 1.0;
          const topFade = ny < 0.04 ? ny / 0.04 : 1.0;
          const alpha = baseAlpha * stretchAlpha * hemFade * topFade * (0.7 + b * 0.2);

          const idx = (py * W + ppx) * 4;
          px[idx]     = Math.max(0, Math.min(255, r + 0.5)) | 0;
          px[idx + 1] = Math.max(0, Math.min(255, g + 0.5)) | 0;
          px[idx + 2] = Math.max(0, Math.min(255, bv + 0.5)) | 0;
          px[idx + 3] = Math.max(0, Math.min(255, alpha * 255 + 0.5)) | 0;
        }
      }

      ctx.putImageData(buf, 0, 0);
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
