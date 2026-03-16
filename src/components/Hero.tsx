"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import NetworkMesh from "./NetworkMesh";
import NoiseSvg from "./NoiseSvg";

/* ── Typing engine ────────────────────────────────────────────── */

interface Token {
  text: string;
  type: "normal" | "complexity" | "clarity";
}

const TOKENS: Token[] = [
  { text: "I turn ", type: "normal" },
  { text: "complexity", type: "complexity" },
  { text: " into ", type: "normal" },
  { text: "clarity", type: "clarity" },
];

const FULL_TEXT = TOKENS.map((t) => t.text).join("");

/* ── Easing helper ────────────────────────────────────────────── */

// cubic-bezier approximation for CSS ease-out
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/* ── Hero ──────────────────────────────────────────────────────── */

export default function Hero() {
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState<"waiting" | "typing" | "done">("waiting");
  const [noiseActive, setNoiseActive] = useState(false);
  const [clarityGlow, setClarityGlow] = useState(false);
  const [glowScale, setGlowScale] = useState(0); // 0→1, animated with easing
  const [showRest, setShowRest] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const glowFrameRef = useRef(0);

  const getTokenAt = useCallback((idx: number) => {
    let offset = 0;
    for (const token of TOKENS) {
      if (idx < offset + token.text.length) return token.type;
      offset += token.text.length;
    }
    return "normal" as const;
  }, []);

  // Start typing
  useEffect(() => {
    const start = setTimeout(() => setPhase("typing"), 800);
    return () => clearTimeout(start);
  }, []);

  // Animated glow ramp — eased, not linear
  useEffect(() => {
    if (!clarityGlow) return;
    const start = performance.now();
    const duration = 1200; // slow, luxurious ramp

    const animate = (now: number) => {
      const elapsed = now - start;
      const raw = Math.min(1, elapsed / duration);
      setGlowScale(easeOutCubic(raw));
      if (raw < 1) {
        glowFrameRef.current = requestAnimationFrame(animate);
      }
    };
    glowFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(glowFrameRef.current);
  }, [clarityGlow]);

  // Typing loop
  useEffect(() => {
    if (phase !== "typing") return;
    if (charIndex >= FULL_TEXT.length) {
      setPhase("done");
      setNoiseActive(false);
      // Beat before glow
      setTimeout(() => setClarityGlow(true), 200);
      setTimeout(() => setShowRest(true), 1200);
      return;
    }

    const currentToken = getTokenAt(charIndex);

    // Typing speed
    let delay = 65;
    const char = FULL_TEXT[charIndex];
    if (char === " ") delay = 35;
    if (currentToken === "complexity") delay = 80;
    // Clarity: much slower, deliberate
    if (currentToken === "clarity") delay = 150;

    // Noise on during complexity, lingers through " into ", off at clarity
    if (currentToken === "complexity") {
      setNoiseActive(true);
    } else if (currentToken === "clarity") {
      setNoiseActive(false);
    }

    typingRef.current = setTimeout(() => {
      setCharIndex((i) => i + 1);
    }, delay);

    return () => clearTimeout(typingRef.current);
  }, [phase, charIndex, getTokenAt]);

  // Build rendered text
  const rendered = FULL_TEXT.slice(0, charIndex);

  // Glow values — 3x bigger
  const glowShadow = clarityGlow
    ? [
        `0 0 ${60 * glowScale}px rgba(194, 224, 58, ${0.7 * glowScale})`,
        `0 0 ${150 * glowScale}px rgba(194, 224, 58, ${0.4 * glowScale})`,
        `0 0 ${280 * glowScale}px rgba(194, 224, 58, ${0.2 * glowScale})`,
      ].join(", ")
    : "none";

  const renderStyledText = () => {
    let offset = 0;
    return TOKENS.map((token, ti) => {
      const start = offset;
      const end = offset + token.text.length;
      offset = end;

      const visible = rendered.slice(start, end);
      if (!visible) return null;

      if (token.type === "complexity") {
        return (
          <span
            key={ti}
            className="text-lime italic inline-block"
            style={{
              filter: noiseActive ? "url(#textNoise)" : "none",
              transition: "filter 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {visible}
          </span>
        );
      }

      if (token.type === "clarity") {
        return (
          <span
            key={ti}
            className="text-lime italic"
            style={{
              textShadow: glowShadow,
              transition: "text-shadow 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {visible}
          </span>
        );
      }

      return (
        <span key={ti} className="text-slate-100">
          {visible}
        </span>
      );
    });
  };

  const showCursor = phase === "typing" || (phase === "done" && !showRest);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      {/* SVG noise filter definition */}
      <NoiseSvg active={noiseActive} />

      {/* Ambient mesh */}
      <div className="absolute inset-0 opacity-50 pointer-events-none">
        <NetworkMesh />
      </div>

      {/* Soft ambient glow */}
      <div className="absolute top-[10%] right-[15%] w-[500px] h-[500px] rounded-full bg-lime/[0.06] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[15%] left-[8%] w-[350px] h-[350px] rounded-full bg-dark-300/[0.08] blur-[80px] pointer-events-none" />

      {/* Clarity glow bloom — big background pulse behind the text */}
      {clarityGlow && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: `${400 * glowScale}px`,
            height: `${200 * glowScale}px`,
            background: `radial-gradient(ellipse, rgba(194, 224, 58, ${0.12 * glowScale}) 0%, transparent 70%)`,
            filter: `blur(${40 * glowScale}px)`,
            transition: "none", // driven by rAF, not CSS
          }}
        />
      )}

      {/* Grid */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Content */}
      <div className="relative z-30 max-w-5xl mx-auto text-center">
        {/* Role line */}
        <div
          style={{
            opacity: showRest ? 1 : 0,
            transform: showRest ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase text-slate-500 font-medium">
            <span className="w-8 h-px bg-dark-500" />
            Designer &middot; Problem Solver &middot; Systems Thinker
            <span className="w-8 h-px bg-dark-500" />
          </div>
        </div>

        {/* Headline — typed out */}
        <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.92] tracking-tight font-bold min-h-[1.8em]">
          {renderStyledText()}
          {showCursor && (
            <span
              className="inline-block w-[3px] md:w-[5px] h-[0.8em] bg-lime/80 ml-1 align-middle"
              style={{
                animation: "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
          )}
        </h1>

        {/* Subtext + CTA */}
        <div
          style={{
            opacity: showRest ? 1 : 0,
            transform: showRest ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s",
          }}
        >
          <p className="mt-10 md:mt-14 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            I design products and systems that make the complex feel simple —
            blending strategy, structure, and human-centered thinking.
          </p>

          <div
            className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{
              opacity: showRest ? 1 : 0,
              transform: showRest ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
            }}
          >
            <a
              href="#work"
              className="group inline-flex items-center gap-3 bg-lime text-dark-950 px-8 py-4 rounded-full text-sm font-semibold tracking-wide hover:bg-lime-light glow-lime-sm"
              style={{ transition: "background-color 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              View my work
              <svg
                className="w-4 h-4"
                style={{ transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
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
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-10 left-1/2"
        style={{
          opacity: showRest ? 1 : 0,
          transform: showRest
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(10px)",
          transition: "opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs tracking-widest uppercase text-slate-600">
            Scroll
          </span>
          <div className="w-px h-12 bg-gradient-to-b from-lime/30 to-transparent" />
        </div>
      </div>
    </section>
  );
}
