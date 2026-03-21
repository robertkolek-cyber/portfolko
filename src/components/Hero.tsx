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
const REST_START = CLARITY_END + 0.3; // secondary content starts right after clarity is typed

/* ── Scramble config ──────────────────────────────────────────── */
const SCRAMBLE_CHARS = "!?#@&%*/<>{}|~^+-=\\";
const SCRAMBLE_DURATION = 0.32; // seconds each complexity char scrambles before resolving
const SNAP_DURATION = 0.14;     // brief scale-up on resolve

/* ── Component ────────────────────────────────────────────────── */

interface FrameState {
  visibleCount: number;
  elapsedTime: number;
  waterChaos: number; // 0–1, drives water surface
  glowIntensity: number; // 0–1+ (overshoot)
  restOpacity: number;
  restY: number;
  ctaOpacity: number;
  ctaY: number;
  ctaBlur: number;
  scrollOpacity: number;
  scrollY: number;
  cursorOpacity: number;
  showCursor: boolean;
}

export default function Hero({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const [frame, setFrame] = useState<FrameState>({
    visibleCount: 0,
    elapsedTime: 0,
    waterChaos: 0.15,
    glowIntensity: 0,
    restOpacity: 0,
    restY: 24,
    ctaOpacity: 0,
    ctaY: 20,
    ctaBlur: 12,
    scrollOpacity: 0,
    scrollY: 12,
    cursorOpacity: 1,
    showCursor: true,
  });

  const rafRef = useRef(0);
  const startRef = useRef(0);

  // Refs kept for potential external scroll control
  const waterScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse position as a ref — no re-renders, the canvas rAF reads it directly
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      mousePosRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    const handleMouseLeave = () => {
      mousePosRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    startRef.current = performance.now();

    const tick = (now: number) => {
      const t = (now - startRef.current) / 1000; // seconds

      // ── Visible characters ──
      let count = 0;
      for (const entry of TIMELINE.chars) {
        if (t >= entry.time) count++;
        else break;
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
      } else if (t <= CLARITY_START + 1.8) {
        // Long smooth settle — begins overlapping end of complexity, finishes deep into clarity
        const settle = smoothstep(COMPLEXITY_END - 0.2, CLARITY_START + 1.8, t);
        waterChaos = 1.0 - easeOutCubic(settle);
      } else {
        // Fully settled — single centred source, perfect rings
        waterChaos = 0.0;
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

      // ── Secondary content: slow, staggered drift up ──
      const restRaw = Math.min(1, Math.max(0, (t - REST_START) / 1.8));
      const restEased = easeOutCubic(restRaw);

      const ctaRaw = Math.min(1, Math.max(0, (t - REST_START - 0.45) / 1.8));
      const ctaEased = easeOutCubic(ctaRaw);

      const scrollRaw = Math.min(1, Math.max(0, (t - REST_START - 0.9) / 1.8));
      const scrollEased = easeOutCubic(scrollRaw);

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
        elapsedTime: t,
        waterChaos,
        glowIntensity: glow,
        restOpacity: restEased,
        restY: 40 * (1 - restEased),
        ctaOpacity: ctaEased,
        ctaY: 36 * (1 - ctaEased),
        ctaBlur: 12 * (1 - ctaEased),
        scrollOpacity: scrollEased,
        scrollY: 24 * (1 - scrollEased),
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

    const t = frame.elapsedTime;
    const g = frame.glowIntensity;

    const glowShadow = g > 0.01
      ? [
          `0 0 ${50 * g}px rgba(200, 210, 235, ${0.75 * Math.min(1, g)})`,
          `0 0 ${130 * g}px rgba(200, 210, 235, ${0.45 * Math.min(1, g)})`,
          `0 0 ${300 * g}px rgba(200, 210, 235, ${0.2 * Math.min(1, g)})`,
        ].join(", ")
      : "none";

    // Split into two fixed lines so the layout never reflows during typing:
    // Line 1: "I turn " + "complexity"
    // Line 2: " into " + "clarity"
    const line1: CharEntry[] = [];
    const line2: CharEntry[] = [];
    let passedComplexity = false;
    let inLine2 = false;
    for (const entry of visible) {
      if (entry.token === "complexity") passedComplexity = true;
      else if (passedComplexity && entry.token === "normal") inLine2 = true;
      (inLine2 ? line2 : line1).push(entry);
    }

    // Render complexity chars with scramble
    const renderComplexity = (chars: CharEntry[]) =>
      chars.map((entry, ci) => {
        const age = t - entry.time;
        if (age < SCRAMBLE_DURATION) {
          const idx = Math.floor(t * 20 + ci * 7) % SCRAMBLE_CHARS.length;
          return (
            <span key={ci} style={{ display: "inline-block", opacity: Math.min(1, age / 0.08) }}>
              {SCRAMBLE_CHARS[idx]}
            </span>
          );
        }
        const snapProgress = Math.min(1, (age - SCRAMBLE_DURATION) / SNAP_DURATION);
        const scale = 1 + 0.12 * Math.sin(snapProgress * Math.PI);
        return (
          <span key={ci} style={{ display: "inline-block", transform: `scale(${scale})`, transformOrigin: "bottom center" }}>
            {entry.char}
          </span>
        );
      });

    // Render a line's chars, grouping by token
    const renderLine = (chars: CharEntry[]) => {
      const groups: { token: string; entries: CharEntry[] }[] = [];
      for (const entry of chars) {
        const last = groups[groups.length - 1];
        if (last && last.token === entry.token) last.entries.push(entry);
        else groups.push({ token: entry.token, entries: [entry] });
      }
      return groups.map((group, i) => {
        if (group.token === "complexity")
          return <span key={i} className="text-slate-900">{renderComplexity(group.entries)}</span>;
        if (group.token === "clarity")
          return <span key={i} className="text-lime" style={{ textShadow: glowShadow }}>{group.entries.map(e => e.char).join("")}</span>;
        return <span key={i} className="text-slate-100">{group.entries.map(e => e.char).join("")}</span>;
      });
    };

    const cursor = frame.showCursor && (
      <span
        className="inline-block w-[3px] md:w-[5px] h-[0.8em] bg-lime ml-1 align-middle"
        style={{ opacity: frame.cursorOpacity }}
      />
    );

    return (
      <>
        {/* Line 1 — nowrap so complexity never breaks mid-word */}
        <span style={{ display: "block", whiteSpace: "nowrap" }}>
          {renderLine(line1)}
          {line2.length === 0 && cursor}
        </span>
        {/* Line 2 — only rendered once " into " starts */}
        {line2.length > 0 && (
          <span style={{ display: "block", marginTop: "0.5em" }}>
            {renderLine(line2)}
            {cursor}
          </span>
        )}
      </>
    );
  };

  // Scroll-driven split: text fades fast, water zooms in
  const textFade = Math.max(0, 1 - Math.min(1, scrollProgress / 0.03));
  const waterScale = 1 + scrollProgress * 40; // zooms from 1x → ~4x by 8%
  const waterFade = Math.max(0, 1 - Math.min(1, (scrollProgress - 0.04) / 0.06));

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center overflow-hidden px-6">
      {/* Water surface — zooms in on scroll like diving into the circle */}
      <div
        ref={waterScrollRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          transformOrigin: "center center",
          transform: `scale(${waterScale})`,
          opacity: waterFade,
        }}
      >
        <WaterSurface chaos={frame.waterChaos} mousePosRef={mousePosRef} />
      </div>

      {/* Ambient glow — royal blue top-right, light blue bottom-left */}
      <div className="absolute top-[10%] right-[15%] w-[500px] h-[500px] rounded-full bg-lime/[0.12] blur-[120px] pointer-events-none" style={{ opacity: textFade }} />
      <div className="absolute bottom-[15%] left-[8%] w-[400px] h-[400px] rounded-full bg-dark-700/[0.15] blur-[100px] pointer-events-none" style={{ opacity: textFade }} />

      {/* Clarity bloom — background glow that swells behind text */}
      {frame.glowIntensity > 0.01 && (
        <div
          className="absolute top-1/2 left-1/2 pointer-events-none"
          style={{
            width: `${500 * frame.glowIntensity}px`,
            height: `${250 * frame.glowIntensity}px`,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(ellipse, rgba(200, 210, 235, ${0.22 * Math.min(1, frame.glowIntensity)}) 0%, rgba(200, 210, 235, ${0.1 * Math.min(1, frame.glowIntensity)}) 50%, transparent 70%)`,
            filter: `blur(${70 * frame.glowIntensity}px)`,
            opacity: textFade,
          }}
        />
      )}

      {/* Grid */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" style={{ opacity: 0.3 * textFade }} />

      {/* Content — fades out fast on scroll, text disappears before water */}
      <div ref={contentScrollRef} className="relative z-30 max-w-5xl mx-auto text-center" style={{ opacity: textFade, transform: `translateY(${-scrollProgress * 800}px)` }}>
        {/* Role line */}
        <div
          className="mb-6 lg:mb-8 xl:mb-10"
          style={{
            opacity: frame.restOpacity,
            transform: `translateY(${frame.restY}px)`,
          }}
        >
          <div className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase text-slate-500 font-medium">
            <span className="w-8 h-px bg-dark-500" />
            Product Designer
            <span className="w-8 h-px bg-dark-500" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="font-[family-name:var(--font-claim)] text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] xl:text-5xl 2xl:text-7xl leading-[0.95] tracking-tight font-semibold min-h-[1.8em]">
          {renderText()}
        </h1>

        {/* Subtext */}
        <p
          className="mt-6 md:mt-8 lg:mt-10 xl:mt-12 text-sm md:text-base lg:text-lg 2xl:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          style={{
            opacity: frame.restOpacity,
            transform: `translateY(${frame.restY}px)`,
          }}
        >
          Where business logic meets human instinct. Shaping products that turn
          complexity into confidence and decisions into second nature.
        </p>

        {/* CTAs */}
        <div
          className="mt-6 md:mt-8 lg:mt-10 xl:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 lg:gap-4"
          style={{
            opacity: frame.ctaOpacity,
            transform: `translateY(${frame.ctaY}px)`,
            filter: `blur(${frame.ctaBlur}px)`,
          }}
        >
          <a
            href="#work"
            className="group inline-flex items-center gap-2 lg:gap-3 bg-lime text-dark-950 px-6 lg:px-8 py-3 lg:py-4 rounded-full text-xs lg:text-sm font-semibold tracking-wide glow-lime-sm"
            style={{ transition: "background-color 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <span className="group-hover:brightness-110">Jump in my work</span>
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
            className="inline-flex items-center gap-2 text-slate-300 px-6 lg:px-8 py-3 lg:py-4 rounded-full text-xs lg:text-sm font-medium tracking-wide border border-dark-600 hover:border-lime/50 hover:text-lime"
            style={{ transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            Get in touch
          </a>
          <a
            href="/cv.pdf"
            download
            className="inline-flex items-center gap-2 text-slate-400 px-4 lg:px-6 py-3 lg:py-4 rounded-full text-xs lg:text-sm font-medium tracking-wide hover:text-slate-100"
            style={{ transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download CV
          </a>
        </div>

        {/* Scroll indicator — flows after CTAs with guaranteed spacing */}
        <div
          ref={scrollHintRef}
          className="mt-6 xl:mt-10 hidden lg:flex flex-col items-center gap-2"
          style={{
            opacity: frame.scrollOpacity * textFade,
            transform: `translateY(${frame.scrollY}px)`,
          }}
        >
          <span className="text-[10px] lg:text-xs tracking-widest uppercase text-slate-600">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-lime/30 to-transparent hidden xl:block" />
        </div>
      </div>
    </div>
  );
}
