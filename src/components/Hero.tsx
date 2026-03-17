"use client";

import { useEffect, useRef, useState } from "react";
import WaterSurface from "./WaterSurface";

/* ═══════════════════════════════════════════════════════════════
   ONE rAF LOOP. EVERY VALUE A SMOOTH FUNCTION OF TIME.
   THE WATER TELLS THE STORY. THE TEXT JUST CONFIRMS IT.
   ═══════════════════════════════════════════════════════════════ */

/* ── Easing ───────────────────────────────────────────────────── */

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const easeOutBack = (t: number) => {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* ── Typing timeline ──────────────────────────────────────────── */

interface CharEntry {
  char: string;
  time: number;
  token: "normal" | "complexity" | "clarity";
}

const TOKENS: { text: string; type: CharEntry["token"]; msPerChar: number }[] = [
  { text: "I turn ",    type: "normal",     msPerChar: 60 },
  { text: "complexity", type: "complexity", msPerChar: 80 },
  { text: " into ",     type: "normal",     msPerChar: 50 },
  { text: "clarity",    type: "clarity",    msPerChar: 155 },
];

function buildTimeline() {
  const chars: CharEntry[] = [];
  let cursor = 0.6; // initial pause
  for (const tok of TOKENS) {
    for (const ch of tok.text) {
      chars.push({ char: ch, time: cursor, token: tok.type });
      cursor += tok.msPerChar / 1000;
    }
  }
  return chars;
}

const CHARS = buildTimeline();
const LAST_CHAR_TIME = CHARS[CHARS.length - 1].time;

// Phase boundaries
const COMP_START = CHARS.find(c => c.token === "complexity")!.time;
const COMP_END   = CHARS.filter(c => c.token === "complexity").pop()!.time;
const CLAR_START = CHARS.find(c => c.token === "clarity")!.time;
const CLAR_END   = LAST_CHAR_TIME;

// Glow & rest timing
const GLOW_START = CLAR_END + 0.4;
const GLOW_IN    = 2.0;
const GLOW_HOLD  = 1.2;
const GLOW_OUT   = 1.8;
const REST_START = GLOW_START + 0.8;

/* ── Frame state ──────────────────────────────────────────────── */

interface Frame {
  visibleCount: number;
  chaos: number;        // 0-1, drives water surface
  noise: number;        // 0-1, drives text jitter
  glow: number;         // 0-1+, drives clarity bloom
  restOp: number;
  restY: number;
  ctaOp: number;
  ctaY: number;
  scrollOp: number;
  scrollY: number;
  cursorOp: number;
  showCursor: boolean;
  time: number;
}

/* ── Component ────────────────────────────────────────────────── */

export default function Hero() {
  const [f, setF] = useState<Frame>({
    visibleCount: 0,
    chaos: 0,
    noise: 0,
    glow: 0,
    restOp: 0, restY: 24,
    ctaOp: 0, ctaY: 20,
    scrollOp: 0, scrollY: 12,
    cursorOp: 1, showCursor: true,
    time: 0,
  });

  const rafRef   = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = performance.now();

    const tick = (now: number) => {
      const t = (now - startRef.current) / 1000;

      // ── Characters visible ──
      let count = 0;
      for (const ch of CHARS) {
        if (t >= ch.time) count++;
        else break;
      }

      // ── Water chaos ──
      // Calm → anticipation → full chaos → settle → silence
      let chaos = 0;
      if (t < COMP_START) {
        // Gentle anticipation ramp
        chaos = smoothstep(COMP_START - 0.5, COMP_START, t) * 0.12;
      } else if (t <= COMP_END) {
        // Build to full chaos during "complexity"
        const p = smoothstep(COMP_START, COMP_END, t);
        chaos = 0.12 + easeOutCubic(p) * 0.88;
      } else if (t <= CLAR_START) {
        // Settle during " into "
        const p = smoothstep(COMP_END, CLAR_START, t);
        chaos = 1.0 * (1 - easeOutCubic(p));
      } else if (t <= CLAR_END + 0.5) {
        // Final fade during clarity typing
        const p = smoothstep(CLAR_START, CLAR_END + 0.5, t);
        chaos = Math.max(0, 0.08 * (1 - p));
      } else {
        chaos = 0;
      }

      // ── Text noise (jitter intensity) ──
      let noise = 0;
      if (t >= COMP_START && t <= CLAR_START) {
        const up   = smoothstep(COMP_START, COMP_END, t);
        const down = 1 - smoothstep(COMP_END, CLAR_START, t);
        noise = easeOutCubic(up) * down;
      }

      // ── Glow bloom ──
      let glow = 0;
      if (t >= GLOW_START) {
        const e = t - GLOW_START;
        if (e < GLOW_IN)
          glow = easeOutBack(e / GLOW_IN);
        else if (e < GLOW_IN + GLOW_HOLD)
          glow = 1 + Math.sin((e - GLOW_IN) * 2.5) * 0.05;
        else
          glow = Math.max(0, 1 - easeOutCubic(Math.min(1, (e - GLOW_IN - GLOW_HOLD) / GLOW_OUT)));
      }

      // ── Secondary content ──
      const ease = (delay: number) => {
        const raw = Math.max(0, Math.min(1, (t - REST_START - delay) / 0.9));
        return easeOutQuart(raw);
      };
      const restE   = ease(0);
      const ctaE    = ease(0.2);
      const scrollE = ease(0.45);

      // ── Cursor ──
      const typing = t < CLAR_END + 0.1;
      const cursorVis = t < REST_START + 0.3;
      const blink = Math.sin(t * 3.2);
      const cursorAlpha = cursorVis ? (typing ? 0.85 : smoothstep(-0.3, 0.3, blink)) : 0;

      setF({
        visibleCount: count,
        chaos,
        noise,
        glow,
        restOp: restE,
        restY: 24 * (1 - restE),
        ctaOp: ctaE,
        ctaY: 20 * (1 - ctaE),
        scrollOp: scrollE,
        scrollY: 12 * (1 - scrollE),
        cursorOp: cursorAlpha,
        showCursor: cursorVis,
        time: t,
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  /* ── Text rendering ── */

  const renderText = () => {
    const visible = CHARS.slice(0, f.visibleCount);
    if (!visible.length) return null;

    // Group consecutive same-token chars
    const groups: { token: string; text: string }[] = [];
    for (const ch of visible) {
      const last = groups[groups.length - 1];
      if (last && last.token === ch.token) last.text += ch.char;
      else groups.push({ token: ch.token, text: ch.char });
    }

    const g = f.glow;

    // Clarity glow — layered text-shadow
    const glowShadow = g > 0.01
      ? [
          `0 0 ${50 * g}px  rgba(37,  99, 235, ${0.7 * Math.min(1, g)})`,
          `0 0 ${120 * g}px rgba(59, 130, 246, ${0.45 * Math.min(1, g)})`,
          `0 0 ${240 * g}px rgba(147,197, 253, ${0.25 * Math.min(1, g)})`,
        ].join(", ")
      : "none";

    // Complexity jitter — subtle horizontal shake synced to chaos
    const jitterX = f.noise > 0.01
      ? Math.sin(f.time * 28) * f.noise * 2.5
      : 0;

    return groups.map((grp, i) => {
      if (grp.token === "complexity") {
        return (
          <span
            key={i}
            className="text-lime italic inline-block"
            style={{
              transform: jitterX ? `translateX(${jitterX}px)` : "none",
              willChange: f.noise > 0.01 ? "transform" : "auto",
            }}
          >
            {grp.text}
          </span>
        );
      }
      if (grp.token === "clarity") {
        return (
          <span
            key={i}
            className="text-lime italic"
            style={{ textShadow: glowShadow }}
          >
            {grp.text}
          </span>
        );
      }
      return <span key={i} className="text-slate-100">{grp.text}</span>;
    });
  };

  /* ── Render ── */

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-6">
      {/* Water — the star of the show */}
      <div className="absolute inset-0 pointer-events-none">
        <WaterSurface chaos={f.chaos} />
      </div>

      {/* Soft ambient light — very subtle, doesn't compete */}
      <div className="absolute top-[10%] right-[15%] w-[500px] h-[500px] rounded-full bg-lime/[0.07] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[15%] left-[8%]  w-[400px] h-[400px] rounded-full bg-dark-700/[0.08] blur-[120px] pointer-events-none" />

      {/* Clarity bloom — swells behind text after last letter */}
      {f.glow > 0.01 && (
        <div
          className="absolute top-1/2 left-1/2 pointer-events-none"
          style={{
            width:  `${500 * f.glow}px`,
            height: `${250 * f.glow}px`,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(ellipse, rgba(37,99,235,${0.15 * Math.min(1, f.glow)}) 0%, rgba(147,197,253,${0.07 * Math.min(1, f.glow)}) 50%, transparent 70%)`,
            filter: `blur(${50 * f.glow}px)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-30 max-w-5xl mx-auto text-center">
        {/* Role */}
        <div className="mb-10" style={{ opacity: f.restOp, transform: `translateY(${f.restY}px)` }}>
          <div className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase text-slate-500 font-medium">
            <span className="w-8 h-px bg-dark-500" />
            Designer &middot; Problem Solver &middot; Systems Thinker
            <span className="w-8 h-px bg-dark-500" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.92] tracking-tight font-bold min-h-[1.8em]">
          {renderText()}
          {f.showCursor && (
            <span
              className="inline-block w-[3px] md:w-[5px] h-[0.8em] bg-lime ml-1 align-middle"
              style={{ opacity: f.cursorOp }}
            />
          )}
        </h1>

        {/* Sub */}
        <p
          className="mt-10 md:mt-14 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          style={{ opacity: f.restOp, transform: `translateY(${f.restY}px)` }}
        >
          I design products and systems that make the complex feel simple —
          blending strategy, structure, and human-centered thinking.
        </p>

        {/* CTAs */}
        <div
          className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ opacity: f.ctaOp, transform: `translateY(${f.ctaY}px)` }}
        >
          <a
            href="#work"
            className="group inline-flex items-center gap-3 bg-lime text-dark-950 px-8 py-4 rounded-full text-sm font-semibold tracking-wide glow-lime-sm"
            style={{ transition: "background-color 0.4s cubic-bezier(0.16,1,0.3,1)" }}
          >
            <span className="group-hover:brightness-110">View my work</span>
            <svg
              className="w-4 h-4 group-hover:translate-x-1"
              style={{ transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)" }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-slate-300 px-8 py-4 rounded-full text-sm font-medium tracking-wide border border-dark-600 hover:border-lime/50 hover:text-lime"
            style={{ transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)" }}
          >
            Get in touch
          </a>
          <a
            href="/cv.pdf"
            download
            className="inline-flex items-center gap-2 text-slate-400 px-6 py-4 rounded-full text-sm font-medium tracking-wide hover:text-slate-100"
            style={{ transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)" }}
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
        className="absolute bottom-10 left-1/2"
        style={{ opacity: f.scrollOp, transform: `translateX(-50%) translateY(${f.scrollY}px)` }}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs tracking-widest uppercase text-slate-600">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-lime/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}
