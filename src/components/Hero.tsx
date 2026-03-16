"use client";

import { useEffect, useState } from "react";
import NetworkMesh from "./NetworkMesh";

export default function Hero() {
  const [stage, setStage] = useState(0);
  // stage 0 = initial
  // stage 1 = "complexity" visible (glitch-in)
  // stage 2 = pause
  // stage 3 = "clarity" visible (clean fade)
  // stage 4 = rest of content

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 400),
      setTimeout(() => setStage(2), 1800),
      setTimeout(() => setStage(3), 2400),
      setTimeout(() => setStage(4), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
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
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Role line */}
        <div
          className="mb-10 transition-all duration-700 ease-out"
          style={{
            opacity: stage >= 4 ? 1 : 0,
            transform: stage >= 4 ? "translateY(0)" : "translateY(12px)",
          }}
        >
          <div className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase text-slate-500 font-medium">
            <span className="w-8 h-px bg-dark-500" />
            Designer &middot; Problem Solver &middot; Systems Thinker
            <span className="w-8 h-px bg-dark-500" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.92] tracking-tight font-bold">
          {/* "I turn" — fades in first */}
          <span
            className="block transition-all duration-700 ease-out text-slate-100"
            style={{
              opacity: stage >= 1 ? 1 : 0,
              transform: stage >= 1 ? "translateY(0)" : "translateY(20px)",
            }}
          >
            I turn
          </span>

          {/* "complexity" — glitch-in effect via CSS */}
          <span className="block mt-2 relative">
            <span
              className="text-lime italic inline-block transition-all duration-500"
              style={{
                opacity: stage >= 1 ? 1 : 0,
                filter:
                  stage === 1
                    ? "blur(6px) brightness(1.8)"
                    : "blur(0px) brightness(1)",
                transform:
                  stage >= 1
                    ? "translateY(0) scaleX(1)"
                    : "translateY(10px) scaleX(0.95)",
                letterSpacing: stage === 1 ? "0.08em" : "0em",
              }}
            >
              complexity
            </span>
            {/* Glitch echo — flashes once then gone */}
            {stage === 1 && (
              <>
                <span
                  className="absolute inset-0 text-lime/30 italic pointer-events-none"
                  style={{
                    transform: "translateX(4px) translateY(-2px)",
                    animation: "glitch-out 0.6s ease-out forwards",
                  }}
                >
                  complexity
                </span>
                <span
                  className="absolute inset-0 text-dark-300/40 italic pointer-events-none"
                  style={{
                    transform: "translateX(-3px) translateY(2px)",
                    animation: "glitch-out 0.8s ease-out forwards",
                  }}
                >
                  complexity
                </span>
              </>
            )}
          </span>

          {/* "into clarity" — clean, confident, no tricks */}
          <span
            className="block mt-2 transition-all duration-700 ease-out"
            style={{
              opacity: stage >= 3 ? 1 : 0,
              transform: stage >= 3 ? "translateY(0)" : "translateY(16px)",
            }}
          >
            <span className="text-slate-100">into </span>
            <span className="text-lime italic">clarity</span>
          </span>
        </h1>

        {/* Subtext + CTA */}
        <div
          className="transition-all duration-700 ease-out delay-100"
          style={{
            opacity: stage >= 4 ? 1 : 0,
            transform: stage >= 4 ? "translateY(0)" : "translateY(16px)",
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
          opacity: stage >= 4 ? 1 : 0,
          transform:
            stage >= 4
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
