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

/* ── Hero ──────────────────────────────────────────────────────── */

export default function Hero() {
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState<"waiting" | "typing" | "done">("waiting");
  const [noiseActive, setNoiseActive] = useState(false);
  const [clarityGlow, setClarityGlow] = useState(false);
  const [showRest, setShowRest] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  // Typing loop
  useEffect(() => {
    if (phase !== "typing") return;
    if (charIndex >= FULL_TEXT.length) {
      setPhase("done");
      setNoiseActive(false);
      setClarityGlow(true);
      setTimeout(() => setShowRest(true), 500);
      return;
    }

    const currentToken = getTokenAt(charIndex);

    let delay = 70;
    const char = FULL_TEXT[charIndex];
    if (char === " ") delay = 40;
    if (currentToken === "complexity") delay = 85;
    if (currentToken === "clarity") delay = 90;

    // Noise on during complexity and lingering into " into "
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
            className="text-lime italic inline-block transition-[filter] duration-300"
            style={{
              filter: noiseActive ? "url(#textNoise)" : "none",
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
            className="text-lime italic transition-all duration-700"
            style={{
              textShadow: clarityGlow
                ? "0 0 20px rgba(194, 224, 58, 0.6), 0 0 50px rgba(194, 224, 58, 0.3), 0 0 90px rgba(194, 224, 58, 0.15)"
                : "none",
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

      {/* Soft glow */}
      <div className="absolute top-[10%] right-[15%] w-[500px] h-[500px] rounded-full bg-lime/[0.06] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[15%] left-[8%] w-[350px] h-[350px] rounded-full bg-dark-300/[0.08] blur-[80px] pointer-events-none" />

      {/* Grid */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Content */}
      <div className="relative z-30 max-w-5xl mx-auto text-center">
        {/* Role line */}
        <div
          className="mb-10 transition-all duration-700 ease-out"
          style={{
            opacity: showRest ? 1 : 0,
            transform: showRest ? "translateY(0)" : "translateY(12px)",
          }}
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
            <span className="inline-block w-[3px] md:w-[5px] h-[0.8em] bg-lime/80 ml-1 align-middle animate-pulse" />
          )}
        </h1>

        {/* Subtext + CTA */}
        <div
          className="transition-all duration-700 ease-out"
          style={{
            opacity: showRest ? 1 : 0,
            transform: showRest ? "translateY(0)" : "translateY(16px)",
          }}
        >
          <p className="mt-10 md:mt-14 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            I design products and systems that make the complex feel simple —
            blending strategy, structure, and human-centered thinking.
          </p>

          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#work"
              className="group inline-flex items-center gap-3 bg-lime text-dark-950 px-8 py-4 rounded-full text-sm font-semibold tracking-wide hover:bg-lime-light transition-colors duration-300 glow-lime-sm"
            >
              View my work
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
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
              className="inline-flex items-center gap-2 text-slate-300 px-8 py-4 rounded-full text-sm font-medium tracking-wide border border-dark-600 hover:border-lime/50 hover:text-lime transition-all duration-300"
            >
              Get in touch
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 transition-all duration-700"
        style={{
          opacity: showRest ? 1 : 0,
          transform: showRest
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(8px)",
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
