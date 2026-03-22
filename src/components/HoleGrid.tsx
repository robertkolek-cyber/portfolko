"use client";

import { useEffect, useRef } from "react";

/**
 * Grid of circular "holes" that react to chaos level.
 *
 * chaos = 0   → all holes are grey, calm
 * chaos → 1   → holes randomly fill with vibrant colors (complexity)
 * chaos → 0   → smooth settle back to uniform accent color, then grey (clarity)
 */

// Muted palette (low chaos / clarity) — same hues, desaturated, sky-blue tint
const MUTED_COLORS = [
  [182, 168, 198],  // dusty coral + blue
  [182, 188, 198],  // warm sand + blue
  [155, 188, 200],  // sage + blue
  [155, 182, 220],  // soft sky
  [168, 162, 212],  // light plum + blue
  [178, 168, 208],  // dusty rose + blue
  [155, 192, 205],  // pale mint + blue
  [182, 178, 198],  // tan + blue
  [160, 192, 212],  // grey-teal + blue
  [165, 168, 220],  // soft violet + blue
  [182, 192, 195],  // pale gold + blue
  [178, 168, 198],  // muted brick + blue
  [158, 178, 218],  // steel blue
  [160, 182, 200],  // sage green + blue
  [178, 162, 205],  // dusty pink + blue
];
// Storm palette (high chaos / complexity) — dark navy sea
const VIVID_COLORS = [
  [20, 28, 58],    // deep navy
  [25, 38, 68],    // dark steel
  [15, 32, 55],    // midnight
  [18, 40, 65],    // stormy blue
  [28, 25, 60],    // dark indigo
  [22, 35, 52],    // dark slate
  [30, 42, 70],    // navy steel
  [16, 30, 50],    // abyss blue
  [24, 45, 62],    // dark teal
  [20, 22, 55],    // deep indigo
  [28, 38, 65],    // storm grey-blue
  [18, 32, 58],    // ocean depth
  [22, 42, 68],    // dark cerulean
  [15, 28, 48],    // blackened navy
  [25, 35, 62],    // dark dusk
];
// Blend between muted and vivid based on chaos (smoothstep)
function blendColor(chaos: number, idx: number): number[] {
  const t = chaos * chaos * (3 - 2 * chaos);
  const m = MUTED_COLORS[idx];
  const v = VIVID_COLORS[idx];
  return [
    m[0] + (v[0] - m[0]) * t,
    m[1] + (v[1] - m[1]) * t,
    m[2] + (v[2] - m[2]) * t,
  ];
}

interface Hole {
  // Grid position (pixels, center)
  cx: number;
  cy: number;
  // Current color channels (0–255)
  r: number;
  g: number;
  b: number;
  // Target color channels
  tr: number;
  tg: number;
  tb: number;
  // Current opacity of the fill (0 = just outline, 1 = fully filled)
  fill: number;
  targetFill: number;
  // Random seed for staggered activation
  seed: number;
  // Chaos threshold — when chaos exceeds this, hole activates
  threshold: number;
  // Timing for color changes
  lastColorChange: number;
  // Scale animation
  scale: number;
  targetScale: number;
}

const GREY = { r: 200, g: 210, b: 225 }; // light grey matching the theme
const ACCENT = { r: 37, g: 99, b: 235 };  // royal blue accent

// Deterministic pseudo-random from seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default function HoleGrid({
  chaos,
  className,
}: {
  chaos: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const chaosRef = useRef(chaos);
  const holesRef = useRef<Hole[]>([]);
  const initRef = useRef(false);
  const timeRef = useRef(0);

  chaosRef.current = chaos;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Size the canvas to fill container
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initHoles(rect.width, rect.height);
    };

    const SPACING = 48;
    const RADIUS = 8;

    const initHoles = (w: number, h: number) => {
      const holes: Hole[] = [];
      const cols = Math.ceil(w / SPACING) + 2;
      const rows = Math.ceil(h / SPACING) + 2;
      const offsetX = (w - (cols - 1) * SPACING) / 2;
      const offsetY = (h - (rows - 1) * SPACING) / 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const seed = row * 1000 + col;
          holes.push({
            cx: offsetX + col * SPACING,
            cy: offsetY + row * SPACING,
            r: GREY.r, g: GREY.g, b: GREY.b,
            tr: GREY.r, tg: GREY.g, tb: GREY.b,
            fill: 0.15,
            targetFill: 0.15,
            seed,
            threshold: seededRandom(seed) * 0.8,
            lastColorChange: 0,
            scale: 1,
            targetScale: 1,
          });
        }
      }
      holesRef.current = holes;
      initRef.current = true;
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const c = chaosRef.current;
      const holes = holesRef.current;
      if (!initRef.current || holes.length === 0) {
        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Lerp speed
      const lerpSpeed = 0.06;
      const colorLerpSpeed = 0.08;

      for (let i = 0; i < holes.length; i++) {
        const hole = holes[i];

        // Determine target state based on chaos
        if (c > 0.15) {
          // Chaos mode — activate holes that pass their threshold
          if (c > hole.threshold) {
            hole.targetFill = 0.5 + seededRandom(hole.seed + 99) * 0.5;
            hole.targetScale = 1 + seededRandom(hole.seed + 50) * 0.3;

            // Assign color blended between muted↔vivid based on chaos
            const changeInterval = 0.3 + seededRandom(hole.seed + 33) * 0.6;
            if (t - hole.lastColorChange > changeInterval) {
              const colorIdx = Math.floor(seededRandom(hole.seed + Math.floor(t * 3)) * MUTED_COLORS.length);
              const color = blendColor(c, colorIdx);
              hole.tr = color[0];
              hole.tg = color[1];
              hole.tb = color[2];
              hole.lastColorChange = t;
            }
          } else {
            hole.targetFill = 0.15;
            hole.tr = GREY.r;
            hole.tg = GREY.g;
            hole.tb = GREY.b;
            hole.targetScale = 1;
          }
        } else if (c <= 0.01) {
          // Full clarity — settle to accent blue, then fade
          hole.tr = ACCENT.r;
          hole.tg = ACCENT.g;
          hole.tb = ACCENT.b;
          hole.targetFill = 0.25;
          hole.targetScale = 1;
        } else {
          // Transitioning — fade towards grey
          hole.tr = GREY.r;
          hole.tg = GREY.g;
          hole.tb = GREY.b;
          hole.targetFill = 0.15;
          hole.targetScale = 1;
        }

        // Lerp current values toward targets
        hole.r += (hole.tr - hole.r) * colorLerpSpeed;
        hole.g += (hole.tg - hole.g) * colorLerpSpeed;
        hole.b += (hole.tb - hole.b) * colorLerpSpeed;
        hole.fill += (hole.targetFill - hole.fill) * lerpSpeed;
        hole.scale += (hole.targetScale - hole.scale) * lerpSpeed;

        // Draw the hole
        const s = hole.scale;
        const radius = RADIUS * s;

        // Outer ring (always visible)
        ctx.beginPath();
        ctx.arc(hole.cx, hole.cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${GREY.r}, ${GREY.g}, ${GREY.b}, 0.25)`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Inner fill
        if (hole.fill > 0.01) {
          ctx.beginPath();
          ctx.arc(hole.cx, hole.cy, radius * 0.85, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${Math.round(hole.r)}, ${Math.round(hole.g)}, ${Math.round(hole.b)}, ${hole.fill})`;
          ctx.fill();
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
}
