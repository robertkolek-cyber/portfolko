"use client";

import { useEffect, useRef } from "react";

/**
 * Grid of circular "holes" that react to chaos level.
 *
 * chaos = 0   → all holes are grey, calm
 * chaos → 1   → holes randomly fill with vibrant colors (complexity)
 * chaos → 0   → smooth settle back to uniform accent color, then grey (clarity)
 */

// Muted palette
const MUTED_COLORS = [
  [180, 120, 130],  // dusty rose
  [180, 170, 120],  // warm khaki
  [120, 170, 140],  // sage
  [120, 150, 180],  // slate blue
  [160, 120, 180],  // soft plum
  [180, 130, 160],  // mauve
  [130, 175, 165],  // muted teal
  [180, 150, 120],  // tan
  [140, 170, 175],  // grey-teal
  [150, 120, 170],  // dusty violet
  [175, 170, 130],  // soft olive
  [170, 135, 135],  // muted brick
  [130, 145, 170],  // steel blue
  [130, 155, 140],  // sage green
  [170, 130, 145],  // dusty pink
];

// Brighten: same hue, higher saturation + brightness
function brightenHole(rgb: number[], amount: number): number[] {
  const max = Math.max(...rgb);
  const min = Math.min(...rgb);
  const range = max - min;
  if (range < 1) return rgb.map(v => Math.min(255, v + amount * 80));
  return rgb.map(v => {
    const ratio = (v - min) / range;
    return Math.min(255, Math.max(0,
      v + ratio * amount * 90 - (1 - ratio) * amount * 25
    ));
  });
}

// Pre-compute bright versions
const BRIGHT_COLORS = MUTED_COLORS.map(m => brightenHole(m, 1.0));

// Blend between muted and bright based on chaos (smoothstep easing)
function blendColor(chaos: number, idx: number): number[] {
  const t = chaos * chaos * (3 - 2 * chaos); // smoothstep
  const m = MUTED_COLORS[idx];
  const b = BRIGHT_COLORS[idx];
  return [
    m[0] + (b[0] - m[0]) * t,
    m[1] + (b[1] - m[1]) * t,
    m[2] + (b[2] - m[2]) * t,
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

            // Assign color blended between muted↔neon based on chaos, change periodically
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
