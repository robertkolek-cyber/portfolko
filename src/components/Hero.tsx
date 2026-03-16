"use client";

import { useEffect, useRef, useState } from "react";
import NetworkMesh from "./NetworkMesh";

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

// Glow starts after a beat
const GLOW_START = CLARITY_END + 0.3;
const GLOW_DURATION = 1.4;
const REST_START = GLOW_START + 0.6; // secondary content

/* ── Component ────────────────────────────────────────────────── */

interface FrameState {
  visibleCount: number;
  noiseIntensity: number; // 0–1 smooth
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
        // Ramp up during complexity
        const rampUp = smoothstep(COMPLEXITY_START, COMPLEXITY_END, t);
        // Ramp down from " into " through clarity
        const rampDown = 1 - smoothstep(CLARITY_START - 0.15, CLARITY_END, t);
        noise = easeOutCubic(rampUp) * rampDown;
      }

      // ── Drive SVG filter from the same loop ──
      if (noise > 0.01) {
        seed += 3;
        if (turbRef.current) {
          turbRef.current.setAttribute("seed", String(seed));
          // Frequency wobble for organic crunch
          const freq = 0.55 + Math.sin(t * 5.5) * 0.2;
          turbRef.current.setAttribute("baseFrequency", String(freq.toFixed(3)));
        }
        if (dispRef.current) {
          // Scale pulsates, modulated by overall intensity
          const scale = noise * (20 + Math.sin(t * 7.3) * 8);
          dispRef.current.setAttribute("scale", String(scale.toFixed(1)));
        }
      } else {
        if (dispRef.current) dispRef.current.setAttribute("scale", "0");
      }

      // ── Glow: overshoot curve ──
      let glow = 0;
      if (t >= GLOW_START) {
        const raw = Math.min(1, (t - GLOW_START) / GLOW_DURATION);
        glow = easeOutBack(raw);
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
          `0 0 ${60 * g}px rgba(194, 224, 58, ${0.7 * Math.min(1, g)})`,
          `0 0 ${150 * g}px rgba(194, 224, 58, ${0.4 * Math.min(1, g)})`,
          `0 0 ${280 * g}px rgba(194, 224, 58, ${0.2 * Math.min(1, g)})`,
        ].join(", ")
      : "none";

    return groups.map((group, i) => {
      if (group.token === "complexity") {
        return (
          <span
            key={i}
            className="text-lime italic inline-block"
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      {/* SVG noise filter — driven from the main rAF loop */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="textNoise" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="0.55"
              numOctaves="4"
              seed="0"
              result="noise"
            />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="noise"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Ambient mesh */}
      <div className="absolute inset-0 opacity-50 pointer-events-none">
        <NetworkMesh />
      </div>

      {/* Ambient glow */}
      <div className="absolute top-[10%] right-[15%] w-[500px] h-[500px] rounded-full bg-lime/[0.06] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[15%] left-[8%] w-[350px] h-[350px] rounded-full bg-dark-300/[0.08] blur-[80px] pointer-events-none" />

      {/* Clarity bloom — background glow that swells behind text */}
      {frame.glowIntensity > 0.01 && (
        <div
          className="absolute top-1/2 left-1/2 pointer-events-none"
          style={{
            width: `${500 * frame.glowIntensity}px`,
            height: `${250 * frame.glowIntensity}px`,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(ellipse, rgba(194, 224, 58, ${0.14 * Math.min(1, frame.glowIntensity)}) 0%, transparent 70%)`,
            filter: `blur(${50 * frame.glowIntensity}px)`,
          }}
        />
      )}

      {/* Grid */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Content */}
      <div className="relative z-30 max-w-5xl mx-auto text-center">
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
        </div>
      </div>

      {/* Scroll indicator */}
      <div
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
    </section>
  );
}
