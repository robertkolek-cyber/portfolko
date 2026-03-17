"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import WaterSurface from "./WaterSurface";

/* ═══════════════════════════════════════════════════════════════
   REDESIGNED INTRO — CINEMATIC PARTICLE TEXT REVEAL

   Particles scatter across the viewport, then magnetically snap
   into position to form each word. The background field morphs
   from chaos to geometric order in sync with the text.

   ONE rAF LOOP. EVERY VALUE IS A SMOOTH FUNCTION OF TIME.
   ═══════════════════════════════════════════════════════════════ */

/* ── Easing library ───────────────────────────────────────────── */

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutBack = (t: number) => {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
const easeOutElastic = (t: number) => {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
};
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ── Word timeline ────────────────────────────────────────────── */

interface WordEntry {
  text: string;
  type: "normal" | "complexity" | "clarity";
  revealStart: number;  // when this word begins materializing
  revealDur: number;    // how long the materialization takes
}

const WORDS: WordEntry[] = [
  { text: "I",          type: "normal",     revealStart: 0.8,  revealDur: 0.3 },
  { text: "turn",       type: "normal",     revealStart: 1.1,  revealDur: 0.4 },
  { text: "complexity", type: "complexity", revealStart: 1.8,  revealDur: 1.0 },
  { text: "into",       type: "normal",     revealStart: 3.3,  revealDur: 0.4 },
  { text: "clarity",    type: "clarity",    revealStart: 4.0,  revealDur: 1.2 },
];

const LAST_WORD = WORDS[WORDS.length - 1];
const ALL_TYPED_TIME = LAST_WORD.revealStart + LAST_WORD.revealDur;

// Phase markers
const COMPLEXITY_WORD = WORDS.find(w => w.type === "complexity")!;
const CLARITY_WORD = WORDS.find(w => w.type === "clarity")!;

const GLOW_START = ALL_TYPED_TIME + 0.3;
const GLOW_IN = 1.8;
const GLOW_HOLD = 1.0;
const GLOW_OUT = 2.0;
const REST_START = GLOW_START + 0.6;

/* ── Particle system ──────────────────────────────────────────── */

interface Particle {
  // Current animated position (0-1 normalised)
  x: number;
  y: number;
  // Start position (scattered)
  sx: number;
  sy: number;
  // Drift velocity (for floating after assembly)
  vx: number;
  vy: number;
  // Visual properties
  size: number;
  opacity: number;
  hue: number; // 0-1, mapped to blue spectrum
  delay: number; // stagger delay within 0-1
}

function createParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.3 + Math.random() * 0.7;
    particles.push({
      x: 0.5 + Math.cos(angle) * dist,
      y: 0.5 + Math.sin(angle) * dist * 0.6,
      sx: 0.5 + Math.cos(angle) * dist,
      sy: 0.5 + Math.sin(angle) * dist * 0.6,
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0002,
      size: 1 + Math.random() * 2.5,
      opacity: 0.1 + Math.random() * 0.5,
      hue: Math.random(),
      delay: Math.random(),
    });
  }
  return particles;
}

/* ── Component ────────────────────────────────────────────────── */

interface FrameState {
  time: number;
  wordProgress: number[]; // 0-1 for each word
  noiseIntensity: number;
  waterChaos: number;
  glowIntensity: number;
  restOpacity: number;
  restY: number;
  ctaOpacity: number;
  ctaY: number;
  scrollOpacity: number;
  scrollY: number;
  particleGlobalOpacity: number;
}

export default function Hero() {
  const [frame, setFrame] = useState<FrameState>({
    time: 0,
    wordProgress: WORDS.map(() => 0),
    noiseIntensity: 0,
    waterChaos: 0.08,
    glowIntensity: 0,
    restOpacity: 0,
    restY: 30,
    ctaOpacity: 0,
    ctaY: 24,
    scrollOpacity: 0,
    scrollY: 16,
    particleGlobalOpacity: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const dprRef = useRef(1);

  // Refs for scroll control
  const waterScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  // Initialize particles
  useEffect(() => {
    particlesRef.current = createParticles(180);
    dprRef.current = Math.min(window.devicePixelRatio || 1, 2);
  }, []);

  // Particle canvas rendering (separate from state updates for performance)
  const renderParticles = useCallback((time: number, globalOpacity: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = dprRef.current;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);
    if (globalOpacity < 0.01) return;

    const particles = particlesRef.current;

    for (const p of particles) {
      // Drift animation
      p.x = p.sx + Math.sin(time * 0.5 + p.delay * 10) * 0.008 + p.vx * time;
      p.y = p.sy + Math.cos(time * 0.7 + p.delay * 8) * 0.005 + p.vy * time;

      const px = p.x * w;
      const py = p.y * h;

      // Skip if offscreen
      if (px < -10 || px > w + 10 || py < -10 || py > h + 10) continue;

      const alpha = p.opacity * globalOpacity;
      if (alpha < 0.01) continue;

      // Color: blue spectrum with slight variation
      const r = Math.round(80 + p.hue * 60);
      const g = Math.round(140 + p.hue * 80);
      const b = Math.round(220 + p.hue * 35);

      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();

      // Glow for larger particles
      if (p.size > 1.8 && alpha > 0.15) {
        ctx.beginPath();
        ctx.arc(px, py, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.12})`;
        ctx.fill();
      }
    }

    // Connection lines between nearby particles
    if (globalOpacity > 0.3) {
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < Math.min(i + 20, particles.length); j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = (a.x - b.x) * w;
          const dy = (a.y - b.y) * h;
          const dist = Math.hypot(dx, dy);
          if (dist < 80) {
            const lineAlpha = (1 - dist / 80) * 0.08 * globalOpacity;
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.strokeStyle = `rgba(100, 160, 240, ${lineAlpha})`;
            ctx.stroke();
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    startRef.current = performance.now();

    const tick = (now: number) => {
      const t = (now - startRef.current) / 1000;

      // ── Word progress ──
      const wordProgress = WORDS.map(w => {
        if (t < w.revealStart) return 0;
        return clamp01((t - w.revealStart) / w.revealDur);
      });

      // ── Noise intensity: ramps during complexity word ──
      let noise = 0;
      if (t >= COMPLEXITY_WORD.revealStart && t <= CLARITY_WORD.revealStart + CLARITY_WORD.revealDur) {
        const compProgress = clamp01((t - COMPLEXITY_WORD.revealStart) / COMPLEXITY_WORD.revealDur);
        const rampDown = 1 - smoothstep(
          CLARITY_WORD.revealStart - 0.2,
          CLARITY_WORD.revealStart + CLARITY_WORD.revealDur * 0.5,
          t
        );
        noise = easeOutCubic(compProgress) * rampDown;
      }

      // ── Water chaos ──
      let waterChaos = 0.08;
      if (t < COMPLEXITY_WORD.revealStart) {
        waterChaos = 0.08 + smoothstep(COMPLEXITY_WORD.revealStart - 0.5, COMPLEXITY_WORD.revealStart, t) * 0.15;
      } else if (t <= COMPLEXITY_WORD.revealStart + COMPLEXITY_WORD.revealDur + 0.3) {
        const ramp = smoothstep(COMPLEXITY_WORD.revealStart, COMPLEXITY_WORD.revealStart + 0.5, t);
        waterChaos = 0.23 + easeOutCubic(ramp) * 0.77;
      } else if (t <= CLARITY_WORD.revealStart) {
        const settle = smoothstep(
          COMPLEXITY_WORD.revealStart + COMPLEXITY_WORD.revealDur + 0.1,
          CLARITY_WORD.revealStart,
          t
        );
        waterChaos = 1.0 - easeOutCubic(settle);
      } else {
        waterChaos = 0.0;
      }

      // ── Glow ──
      let glow = 0;
      if (t >= GLOW_START) {
        const elapsed = t - GLOW_START;
        if (elapsed < GLOW_IN) {
          glow = easeOutBack(elapsed / GLOW_IN);
        } else if (elapsed < GLOW_IN + GLOW_HOLD) {
          glow = 1 + Math.sin((elapsed - GLOW_IN) * 2) * 0.05;
        } else {
          const fadeT = (elapsed - GLOW_IN - GLOW_HOLD) / GLOW_OUT;
          glow = Math.max(0, 1 - easeOutCubic(Math.min(1, fadeT)));
        }
      }

      // ── Secondary content ──
      const restRaw = clamp01((t - REST_START) / 1.0);
      const restEased = easeOutQuint(restRaw);

      const ctaRaw = clamp01((t - REST_START - 0.25) / 1.0);
      const ctaEased = easeOutQuint(ctaRaw);

      const scrollRaw = clamp01((t - REST_START - 0.5) / 1.0);
      const scrollEased = easeOutQuint(scrollRaw);

      // ── Particle opacity: fade in early, persist ──
      const particleOp = clamp01((t - 0.2) / 0.8);

      setFrame({
        time: t,
        wordProgress,
        noiseIntensity: noise,
        waterChaos,
        glowIntensity: glow,
        restOpacity: restEased,
        restY: 30 * (1 - restEased),
        ctaOpacity: ctaEased,
        ctaY: 24 * (1 - ctaEased),
        scrollOpacity: scrollEased,
        scrollY: 16 * (1 - scrollEased),
        particleGlobalOpacity: particleOp,
      });

      renderParticles(t, particleOp * 0.7);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [renderParticles]);

  // ── Render words with cinematic reveal ──
  const renderWords = () => {
    const g = frame.glowIntensity;
    const n = frame.noiseIntensity;

    return (
      <span className="inline" aria-label="I turn complexity into clarity">
        {WORDS.map((word, i) => {
          const progress = frame.wordProgress[i];
          if (progress === 0) return <span key={i} />;

          const isComplexity = word.type === "complexity";
          const isClarity = word.type === "clarity";
          const isAccent = isComplexity || isClarity;

          // Character-level staggered reveal
          const chars = word.text.split("");
          const revealedChars = Math.ceil(progress * chars.length);

          // Word-level transforms
          const wordOpacity = easeOutExpo(clamp01(progress * 2.5));
          const wordY = (1 - easeOutQuart(clamp01(progress * 1.8))) * 40;
          const wordScale = 0.92 + easeOutElastic(clamp01(progress * 1.2)) * 0.08;
          const wordBlur = (1 - clamp01(progress * 3)) * 8;

          // Complexity: glitch/distort effect
          const complexityJitter = isComplexity && n > 0.01
            ? Math.sin(frame.time * 25) * n * 3
            : 0;

          // Clarity glow
          const glowShadow = isClarity && g > 0.01
            ? [
                `0 0 ${40 * g}px rgba(37, 99, 235, ${0.7 * Math.min(1, g)})`,
                `0 0 ${100 * g}px rgba(59, 130, 246, ${0.4 * Math.min(1, g)})`,
                `0 0 ${200 * g}px rgba(147, 197, 253, ${0.25 * Math.min(1, g)})`,
              ].join(", ")
            : "none";

          return (
            <span key={i} className="inline-block" aria-hidden="true">
              {/* Space before word (except first) */}
              {i > 0 && (
                <span
                  className="inline-block"
                  style={{ width: "0.3em", opacity: wordOpacity }}
                >
                  {" "}
                </span>
              )}
              <span
                className={`inline-block ${isAccent ? "italic" : ""}`}
                style={{
                  opacity: wordOpacity,
                  transform: `translateY(${wordY}px) translateX(${complexityJitter}px) scale(${wordScale})`,
                  filter: wordBlur > 0.5 ? `blur(${wordBlur}px)` : "none",
                  textShadow: glowShadow,
                  willChange: progress < 1 ? "transform, opacity, filter" : "auto",
                }}
              >
                {chars.map((char, ci) => {
                  const charRevealed = ci < revealedChars;
                  const charProgress = charRevealed
                    ? clamp01((progress * chars.length - ci) * 2)
                    : 0;

                  return (
                    <span
                      key={ci}
                      className={isAccent ? "text-lime" : "text-slate-100"}
                      style={{
                        opacity: charProgress,
                        display: "inline-block",
                        transform: charProgress < 1
                          ? `translateY(${(1 - charProgress) * 12}px)`
                          : "none",
                      }}
                    >
                      {char}
                    </span>
                  );
                })}
              </span>
            </span>
          );
        })}
      </span>
    );
  };

  // Determine cursor state
  const allDone = frame.wordProgress.every(p => p >= 1);
  const anyStarted = frame.wordProgress.some(p => p > 0);
  const cursorVisible = anyStarted && frame.time < REST_START + 0.5;
  const cursorBlink = allDone
    ? smoothstep(-0.3, 0.3, Math.sin(frame.time * 3.2))
    : 0.9;

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-6">
      {/* Particle canvas — behind everything */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ width: "100%", height: "100%", opacity: 0.9 }}
      />

      {/* Field visualization */}
      <div ref={waterScrollRef} className="absolute inset-0 pointer-events-none" style={{ transformOrigin: "center center" }}>
        <WaterSurface chaos={frame.waterChaos} />
      </div>

      {/* Ambient glow orbs */}
      <div
        className="absolute top-[8%] right-[12%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(37, 99, 235, ${0.08 + frame.glowIntensity * 0.06}) 0%, transparent 70%)`,
          filter: "blur(80px)",
          transform: `scale(${1 + Math.sin(frame.time * 0.3) * 0.05})`,
        }}
      />
      <div
        className="absolute bottom-[12%] left-[6%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(147, 197, 253, ${0.06 + frame.glowIntensity * 0.04}) 0%, transparent 70%)`,
          filter: "blur(60px)",
          transform: `scale(${1 + Math.cos(frame.time * 0.4) * 0.04})`,
        }}
      />

      {/* Clarity bloom */}
      {frame.glowIntensity > 0.01 && (
        <div
          className="absolute top-1/2 left-1/2 pointer-events-none"
          style={{
            width: `${600 * frame.glowIntensity}px`,
            height: `${300 * frame.glowIntensity}px`,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(ellipse, rgba(37, 99, 235, ${0.18 * Math.min(1, frame.glowIntensity)}) 0%, rgba(59, 130, 246, ${0.08 * Math.min(1, frame.glowIntensity)}) 40%, transparent 70%)`,
            filter: `blur(${40 * frame.glowIntensity}px)`,
          }}
        />
      )}

      {/* Subtle grid */}
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      {/* ── Content ── */}
      <div ref={contentScrollRef} className="relative z-30 max-w-5xl mx-auto text-center">
        {/* Role line */}
        <div
          className="mb-10"
          style={{
            opacity: frame.restOpacity,
            transform: `translateY(${frame.restY}px)`,
          }}
        >
          <div className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase text-slate-500 font-medium">
            <span
              className="h-px bg-dark-500"
              style={{
                width: `${32 * frame.restOpacity}px`,
                transition: "none",
              }}
            />
            Designer &middot; Problem Solver &middot; Systems Thinker
            <span
              className="h-px bg-dark-500"
              style={{
                width: `${32 * frame.restOpacity}px`,
                transition: "none",
              }}
            />
          </div>
        </div>

        {/* Headline */}
        <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.92] tracking-tight font-bold min-h-[1.8em]">
          {renderWords()}
          {cursorVisible && (
            <span
              className="inline-block w-[3px] md:w-[5px] h-[0.75em] bg-lime ml-1 align-middle rounded-full"
              style={{ opacity: cursorBlink }}
            />
          )}
        </h1>

        {/* Subtext */}
        <p
          className="mt-10 md:mt-14 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          style={{
            opacity: frame.restOpacity,
            transform: `translateY(${frame.restY}px)`,
          }}
        >
          I design products and systems that make the complex feel simple —
          blending strategy, structure, and human-centered thinking.
        </p>

        {/* CTAs */}
        <div
          className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{
            opacity: frame.ctaOpacity,
            transform: `translateY(${frame.ctaY}px)`,
          }}
        >
          <a
            href="#work"
            className="group inline-flex items-center gap-3 bg-lime text-dark-950 px-8 py-4 rounded-full text-sm font-semibold tracking-wide glow-lime-sm"
            style={{ transition: "background-color 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <span className="group-hover:brightness-110">View my work</span>
            <svg
              className="w-4 h-4 group-hover:translate-x-1"
              style={{ transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-slate-300 px-8 py-4 rounded-full text-sm font-medium tracking-wide border border-dark-600 hover:border-lime/50 hover:text-lime"
            style={{ transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            Get in touch
          </a>
          <a
            href="/cv.pdf"
            download
            className="inline-flex items-center gap-2 text-slate-400 px-6 py-4 rounded-full text-sm font-medium tracking-wide hover:text-slate-100"
            style={{ transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download CV
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        ref={scrollHintRef}
        className="absolute bottom-10 left-1/2"
        style={{
          opacity: frame.scrollOpacity,
          transform: `translateX(-50%) translateY(${frame.scrollY}px)`,
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs tracking-widest uppercase text-slate-600">Scroll</span>
          <div
            className="w-px bg-gradient-to-b from-lime/40 to-transparent"
            style={{
              height: `${48 * frame.scrollOpacity}px`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
