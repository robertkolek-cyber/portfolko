"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import NetworkMesh from "./NetworkMesh";
import { ScrambleText, TypeRevealText } from "./TextScramble";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [morphProgress, setMorphProgress] = useState(0);
  const [textReady, setTextReady] = useState(false);

  // Trigger text animations after mount
  useEffect(() => {
    const timer = setTimeout(() => setTextReady(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Scroll-driven morph: 0 at top, 1 when scrolled past hero
  const handleScroll = useCallback(() => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const h = sectionRef.current.offsetHeight;
    // Progress goes 0→1 as user scrolls through the hero
    const raw = Math.max(0, -rect.top) / (h * 0.6);
    setMorphProgress(Math.min(1, raw));
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[140vh] overflow-hidden"
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient that shifts with morph */}
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background: `radial-gradient(ellipse at 70% 40%, rgba(194, 224, 58, ${
              0.04 + morphProgress * 0.08
            }) 0%, transparent 60%)`,
          }}
        />

        {/* Canvas mesh - sits behind text */}
        <div className="absolute inset-0 opacity-70">
          <NetworkMesh progress={morphProgress} />
        </div>

        {/* Grid overlay that fades in with clarity */}
        <div
          className="absolute inset-0 grid-bg transition-opacity duration-1000"
          style={{ opacity: 0.3 + morphProgress * 0.7 }}
        />

        {/* Main content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          <p
            className="text-sm md:text-base tracking-[0.3em] uppercase text-slate-400 font-medium mb-8 animate-fade-up"
          >
            Designer &middot; Problem Solver &middot; Systems Thinker
          </p>

          <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.95] tracking-tight font-bold">
            <span className="animate-fade-up delay-100 block">
              I turn
            </span>
            <span className="block mt-1 animate-fade-up delay-200">
              <ScrambleText
                text="complexity"
                delay={800}
                duration={2200}
                trigger={textReady}
                className="text-lime italic inline-block min-w-[4ch]"
              />
            </span>
            <span className="animate-fade-up delay-300 block mt-1">
              into{" "}
              <TypeRevealText
                text="clarity"
                delay={2800}
                speed={100}
                trigger={textReady}
                className="text-lime italic"
              />
            </span>
          </h1>

          <p className="animate-fade-up delay-500 mt-10 md:mt-14 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            I design products and systems that make the complex feel simple —
            blending strategy, structure, and human-centered thinking.
          </p>

          {/* Progress indicator — morphs from tangled to clean */}
          <div className="animate-fade-up delay-600 mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
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

        {/* Scroll indicator with morph hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-fade-in delay-600">
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs tracking-widest uppercase text-slate-500">
              Scroll to clarify
            </span>
            <div className="relative w-px h-12">
              <div className="absolute inset-0 bg-gradient-to-b from-lime/40 to-transparent" />
              <div
                className="absolute top-0 left-0 w-full bg-lime/80"
                style={{
                  height: `${morphProgress * 100}%`,
                  transition: "height 0.1s linear",
                }}
              />
            </div>
          </div>
        </div>

        {/* Corner labels that morph */}
        <div className="absolute bottom-10 left-6 md:left-12 animate-fade-in delay-500">
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full transition-all duration-500"
              style={{
                backgroundColor: `rgba(194, 224, 58, ${0.3 + morphProgress * 0.7})`,
                boxShadow:
                  morphProgress > 0.5
                    ? "0 0 8px rgba(194, 224, 58, 0.5)"
                    : "none",
              }}
            />
            <span
              className="text-xs tracking-widest uppercase font-medium transition-colors duration-500"
              style={{
                color:
                  morphProgress < 0.5
                    ? "rgba(154, 171, 178, 0.6)"
                    : "rgba(194, 224, 58, 0.8)",
              }}
            >
              {morphProgress < 0.5 ? "Complexity" : "Clarity"}
            </span>
          </div>
        </div>

        <div className="absolute bottom-10 right-6 md:right-12 animate-fade-in delay-500">
          <span className="text-xs tracking-widest uppercase text-slate-500">
            {String(Math.round(morphProgress * 100)).padStart(3, "0")}%
          </span>
        </div>
      </div>
    </section>
  );
}
