"use client";

import { useEffect, useRef, useState } from "react";
import WaterSurface from "./WaterSurface";

/* ═══════════════════════════════════════════════════════════════
   ONE TIMELINE. ONE rAF LOOP. EVERY VALUE IS A SMOOTH FUNCTION
   OF TIME. NO setTimeout. NO CSS transition. NO linear easing.
   ═══════════════════════════════════════════════════════════════ */

/* ── Easing library ───────────────────────────────────────────── */

// Smooth deceleration — fast start, gentle stop
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// Dramatic deceleration — even snappier
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

// Overshoot then settle — for the glow bloom
const easeOutBack = (t: number) => {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

// Smooth step — nice for interpolating curves
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/* ── Token timeline ───────────────────────────────────────────── */

interface CharEntry {
  char: string;
  time: number; // exact second this character appears
  token: "normal" | "complexity" | "clarity";
}

function buildTimeline(): { chars: CharEntry[]; totalDuration: number } {
  const tokens: { text: string; type: "normal" | "complexity" | "clarity"; msPerChar: number }[] = [
    { text: "I turn ", type: "normal", msPerChar: 60 },
    { text: "complexity", type: "complexity", msPerChar: 80 },
    { text: " into ", type: "normal", msPerChar: 50 },
    { text: "clarity", type: "clarity", msPerChar: 155 },
  ];

  const startDelay = 0.6; // seconds before first char
  const chars: CharEntry[] = [];
  let cursor = startDelay;

  for (const token of tokens) {
    for (const char of token.text) {
      chars.push({ char, time: cursor, token: token.type });
      cursor += token.msPerChar / 1000;
    }
  }

  // Beat after last char before glow
  const totalDuration = cursor + 2.5;
  return { chars, totalDuration };
}

const TIMELINE = buildTimeline();
const LAST_CHAR_TIME = TIMELINE.chars[TIMELINE.chars.length - 1].time;

// When does each phase start/end?
const COMPLEXITY_START = TIMELINE.chars.find((c) => c.token === "complexity")!.time;
const COMPLEXITY_END = TIMELINE.chars.filter((c) => c.token === "complexity").pop()!.time;
const CLARITY_START = TIMELINE.chars.find((c) => c.token === "clarity")!.time;
const CLARITY_END = LAST_CHAR_TIME;

// Glow: slow bloom, hold, then fade out
const GLOW_START = CLARITY_END + 0.35;
const GLOW_IN = 2.0;       // slow ramp up
const GLOW_HOLD = 1.2;     // hold at peak
const GLOW_OUT = 1.8;      // fade out
const REST_START = GLOW_START + 1.0; // secondary content starts during glow

/* ── Component ────────────────────────────────────────────────── */

interface FrameState {
  visibleCount: number;
  noiseIntensity: number; // 0–1 smooth
  waterChaos: number; // 0–1, drives water surface
  glowIntensity: number; // 0–1+ (overshoot)
  restOpacity: number;
  restY: number;
  ctaOpacity: number;
  ctaY: number;
  scrollOpacity: number;
  scrollY: number;
  cursorOpacity: number;
  showCursor: boolean;
}

export default function Hero() {
  const [frame, setFrame] = useState<FrameState>({
    visibleCount: 0,
    noiseIntensity: 0,
    waterChaos: 0.15,
    glowIntensity: 0,
    restOpacity: 0,
    restY: 24,
    ctaOpacity: 0,
    ctaY: 20,
    scrollOpacity: 0,
    scrollY: 12,
    cursorOpacity: 1,
    showCursor: true,
  });

  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  // Refs kept for potential external scroll control
  const waterScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startRef.current = performance.now();
    let seed = 0;

    const tick = (now: number) => {
      const t = (now - startRef.current) / 1000; // seconds

      // ── Visible characters ──
      let count = 0;
      for (const entry of TIMELINE.chars) {
        if (t >= entry.time) count++;
        else break;
      }

      // ── Noise intensity: smooth ramp up during complexity, ease down after ──
      let noise = 0;
      if (t >= COMPLEXITY_START && t <= CLARITY_END) {
        const rampUp = smoothstep(COMPLEXITY_START, COMPLEXITY_END, t);
        const rampDown = 1 - smoothstep(CLARITY_START - 0.15, CLARITY_END, t);
        noise = easeOutCubic(rampUp) * rampDown;
      }

      // ── Water chaos: wider arc than text noise ──
      // Starts calm, builds before complexity, peaks during, settles after clarity
      let waterChaos = 0.15; // base: gentle ripple
      if (t < COMPLEXITY_START) {
        // Anticipation — slight build before complexity starts typing
        waterChaos = 0.15 + smoothstep(COMPLEXITY_START - 0.4, COMPLEXITY_START, t) * 0.2;
      } else if (t <= COMPLEXITY_END + 0.3) {
        // Full chaos during complexity
        const ramp = smoothstep(COMPLEXITY_START, COMPLEXITY_START + 0.4, t);
        waterChaos = 0.35 + easeOutCubic(ramp) * 0.65;
      } else if (t <= CLARITY_START) {
        // Settle hard to 0 during " into " — perfectly circular by the time clarity types
        const settle = smoothstep(COMPLEXITY_END + 0.05, CLARITY_START, t);
        waterChaos = 1.0 - easeOutCubic(settle);
      } else {
        // Clarity and beyond — single centered source, perfect rings
        waterChaos = 0.0;
      }

      // ── Drive SVG filter from the same loop ──
      if (noise > 0.01) {
        seed += 4;
        if (turbRef.current) {
          turbRef.current.setAttribute("seed", String(seed));
          // High X freq, very low Y freq → horizontal bands/scanlines
          const freqX = 0.7 + Math.sin(t * 4) * 0.15;
          const freqY = 0.015 + Math.sin(t * 6.3) * 0.008;
          turbRef.current.setAttribute(
            "baseFrequency",
            `${freqX.toFixed(3)} ${freqY.toFixed(4)}`
          );
        }
        if (dispRef.current) {
          // Horizontal tear — mostly X displacement, modulated by intensity
          const scale = noise * (24 + Math.sin(t * 8.5) * 10);
          dispRef.current.setAttribute("scale", String(scale.toFixed(1)));
        }
      } else {
        if (dispRef.current) dispRef.current.setAttribute("scale", "0");
      }

      // ── Glow: slow bloom → hold → fade out ──
      let glow = 0;
      if (t >= GLOW_START) {
        const elapsed = t - GLOW_START;
        if (elapsed < GLOW_IN) {
          // Ramp up with overshoot
          glow = easeOutBack(elapsed / GLOW_IN);
        } else if (elapsed < GLOW_IN + GLOW_HOLD) {
          // Hold at peak with subtle breath
          glow = 1 + Math.sin((elapsed - GLOW_IN) * 2.5) * 0.06;
        } else {
          // Fade out
          const fadeT = (elapsed - GLOW_IN - GLOW_HOLD) / GLOW_OUT;
          glow = Math.max(0, 1 - easeOutCubic(Math.min(1, fadeT)));
        }
      }

      // ── Secondary content: staggered ease-out ──
      const restRaw = Math.min(1, Math.max(0, (t - REST_START) / 0.9));
      const restEased = easeOutQuart(restRaw);

      const ctaRaw = Math.min(1, Math.max(0, (t - REST_START - 0.2) / 0.9));
      const ctaEased = easeOutQuart(ctaRaw);

      const scrollRaw = Math.min(1, Math.max(0, (t - REST_START - 0.45) / 0.9));
      const scrollEased = easeOutQuart(scrollRaw);

      // ── Cursor: smooth sine blink, not CSS ──
      const typing = t < CLARITY_END + 0.1;
      const cursorVisible = t < REST_START + 0.3;
      // Blink with eased sine — holds at extremes, quick transition
      const blinkPhase = Math.sin(t * 3.2);
      const cursorAlpha = cursorVisible
        ? (typing ? 0.85 : smoothstep(-0.3, 0.3, blinkPhase))
        : 0;

      setFrame({
        visibleCount: count,
        noiseIntensity: noise,
        waterChaos,
        glowIntensity: glow,
        restOpacity: restEased,
        restY: 24 * (1 - restEased),
        ctaOpacity: ctaEased,
        ctaY: 20 * (1 - ctaEased),
        scrollOpacity: scrollEased,
        scrollY: 12 * (1 - scrollEased),
        cursorOpacity: cursorAlpha,
        showCursor: cursorVisible,
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // No wheel hijack — scroll is handled by the parent parallax container

  // ── Render visible text with styling ──
  const renderText = () => {
    const visible = TIMELINE.chars.slice(0, frame.visibleCount);
    if (visible.length === 0) return null;

    // Group consecutive chars by token type for single spans
    const groups: { token: string; text: string }[] = [];
    for (const entry of visible) {
      const last = groups[groups.length - 1];
      if (last && last.token === entry.token) {
        last.text += entry.char;
      } else {
        groups.push({ token: entry.token, text: entry.char });
      }
    }

    const n = frame.noiseIntensity;
    const g = frame.glowIntensity;

    const glowShadow = g > 0.01
      ? [
          `0 0 ${60 * g}px rgba(37, 99, 235, ${0.8 * Math.min(1, g)})`,
          `0 0 ${150 * g}px rgba(59, 130, 246, ${0.5 * Math.min(1, g)})`,
          `0 0 ${280 * g}px rgba(147, 197, 253, ${0.3 * Math.min(1, g)})`,
        ].join(", ")
      : "none";

    return groups.map((group, i) => {
      if (group.token === "complexity") {
        return (
          <span
            key={i}
            className="text-slate-900 italic inline-block"
            style={{
              filter: n > 0.01 ? "url(#textNoise)" : "none",
            }}
          >
            {group.text}
          </span>
        );
      }
      if (group.token === "clarity") {
        return (
          <span
            key={i}
            className="text-lime italic"
            style={{ textShadow: glowShadow }}
          >
            {group.text}
          </span>
        );
      }
      return (
        <span key={i} className="text-slate-100">{group.text}</span>
      );
    });
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-6">
      {/* SVG noise filter — driven from the main rAF loop */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="textNoise" x="-15%" y="-5%" width="130%" height="110%">
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="0.7 0.015"
              numOctaves="3"
              seed="0"
              result="noise"
            />
            {/* Zero out the G channel → 0.5 = neutral → no Y displacement */}
            <feColorMatrix
              in="noise"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0.5  0 0 1 0 0  0 0 0 1 0"
              result="noiseH"
            />
            {/* X-only displacement — G is constant 0.5 → pure horizontal tear */}
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="noiseH"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Water surface — zooms in on scroll */}
      <div ref={waterScrollRef} className="absolute inset-0 pointer-events-none" style={{ transformOrigin: "center center" }}>
        <WaterSurface chaos={frame.waterChaos} />
      </div>

      {/* Ambient glow — royal blue top-right, light blue bottom-left */}
      <div className="absolute top-[10%] right-[15%] w-[500px] h-[500px] rounded-full bg-lime/[0.12] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[15%] left-[8%] w-[400px] h-[400px] rounded-full bg-dark-700/[0.15] blur-[100px] pointer-events-none" />

      {/* Clarity bloom — background glow that swells behind text */}
      {frame.glowIntensity > 0.01 && (
        <div
          className="absolute top-1/2 left-1/2 pointer-events-none"
          style={{
            width: `${500 * frame.glowIntensity}px`,
            height: `${250 * frame.glowIntensity}px`,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(ellipse, rgba(37, 99, 235, ${0.2 * Math.min(1, frame.glowIntensity)}) 0%, rgba(147, 197, 253, ${0.1 * Math.min(1, frame.glowIntensity)}) 50%, transparent 70%)`,
            filter: `blur(${50 * frame.glowIntensity}px)`,
          }}
        />
      )}

      {/* Grid */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Content — fades out + drifts up on scroll */}
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
            <span className="w-8 h-px bg-dark-500" />
            Designer &middot; Problem Solver &middot; Systems Thinker
            <span className="w-8 h-px bg-dark-500" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.92] tracking-tight font-bold min-h-[1.8em]">
          {renderText()}
          {frame.showCursor && (
            <span
              className="inline-block w-[3px] md:w-[5px] h-[0.8em] bg-lime ml-1 align-middle"
              style={{ opacity: frame.cursorOpacity }}
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
          <div className="w-px h-12 bg-gradient-to-b from-lime/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}
