"use client";

import { useEffect, useRef } from "react";

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 20;
      const y = (clientY / innerHeight - 0.5) * 20;
      containerRef.current.style.setProperty("--mouse-x", `${x}px`);
      containerRef.current.style.setProperty("--mouse-y", `${y}px`);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 grid-bg"
    >
      {/* Gradient orbs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--color-lime) 0%, transparent 70%)",
          top: "5%",
          right: "10%",
          transform: "translate(var(--mouse-x, 0), var(--mouse-y, 0))",
          transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--color-dark-300) 0%, transparent 70%)",
          bottom: "20%",
          left: "5%",
          transform:
            "translate(calc(var(--mouse-x, 0) * -0.5), calc(var(--mouse-y, 0) * -0.5))",
          transition: "transform 1s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <p className="animate-fade-up text-sm md:text-base tracking-[0.3em] uppercase text-slate-400 font-medium mb-6">
          Designer &middot; Problem Solver &middot; Systems Thinker
        </p>

        <h1 className="animate-fade-up delay-100 font-[family-name:var(--font-display)] text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tight text-balance font-bold">
          I turn{" "}
          <span className="text-lime italic">complexity</span>
          <br />
          into <span className="text-lime italic">clarity</span>
        </h1>

        <p className="animate-fade-up delay-300 mt-8 md:mt-12 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          I design products and systems that make the complex feel simple —
          blending strategy, structure, and human-centered thinking.
        </p>

        <div className="animate-fade-up delay-500 mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#work"
            className="group inline-flex items-center gap-3 bg-lime text-dark-950 px-8 py-4 rounded-full text-sm font-semibold tracking-wide hover:bg-lime-light transition-colors duration-300"
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

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-fade-in delay-600">
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs tracking-widest uppercase text-slate-500">
            Scroll
          </span>
          <div className="w-px h-12 bg-gradient-to-b from-lime/40 to-transparent" />
        </div>
      </div>
    </section>
  );
}
