"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import NetworkMesh from "./NetworkMesh";
import { ScrambleText, ClipRevealText } from "./TextScramble";

/* Attempt to use scheduler for 60 fps scroll, graceful fallback */
function useScrollProgress(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(0);

  const update = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const h = ref.current.offsetHeight - window.innerHeight;
    const raw = Math.max(0, -rect.top) / Math.max(1, h);
    setProgress(Math.min(1, raw));
  }, [ref]);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [update]);

  return progress;
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollProgress = useScrollProgress(sectionRef);
  const [textReady, setTextReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTextReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Choreographed scroll phases:
  // 0.0–0.4: mesh morphs from chaos → order
  // 0.2–0.6: text shifts up with parallax
  // 0.6–1.0: fade out as user enters next section
  const meshProgress = Math.min(1, scrollProgress / 0.5);
  const textParallax = scrollProgress * -120;
  const textOpacity = scrollProgress < 0.6 ? 1 : Math.max(0, 1 - (scrollProgress - 0.6) / 0.3);
  const meshOpacity = scrollProgress < 0.7 ? 0.6 + scrollProgress * 0.3 : Math.max(0, 1 - (scrollProgress - 0.7) / 0.3);

  // Subtitle line fades and shifts separately for depth
  const subParallax = scrollProgress * -60;
  const subOpacity = scrollProgress < 0.5 ? 1 : Math.max(0, 1 - (scrollProgress - 0.5) / 0.25);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: "200vh" }} // more scroll runway for the morph
    >
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* Ambient glow — shifts position with scroll */}
        <div
          className="absolute w-[700px] h-[700px] rounded-full blur-[120px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(194,224,58,0.12) 0%, transparent 70%)",
            top: `${15 - scrollProgress * 10}%`,
            right: `${5 + scrollProgress * 15}%`,
            transition: "none",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(61,122,137,0.12) 0%, transparent 70%)",
            bottom: `${15 + scrollProgress * 10}%`,
            left: `${3 - scrollProgress * 5}%`,
            transition: "none",
          }}
        />

        {/* Network mesh canvas */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: meshOpacity }}
        >
          <NetworkMesh progress={meshProgress} />
        </div>

        {/* Grid overlay — intensifies with clarity */}
        <div
          className="absolute inset-0 grid-bg pointer-events-none"
          style={{ opacity: 0.15 + meshProgress * 0.45 }}
        />

        {/* Text content — parallax layer */}
        <div
          className="relative z-10 max-w-5xl mx-auto text-center px-6"
          style={{
            transform: `translateY(${textParallax}px)`,
            opacity: textOpacity,
          }}
        >
          {/* Role tags */}
          <div
            className="mb-10 animate-fade-up"
            style={{
              transform: `translateY(${subParallax * 0.3}px)`,
              opacity: subOpacity,
            }}
          >
            <div className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase text-slate-500 font-medium">
              <span className="w-8 h-px bg-slate-600" />
              Designer &middot; Problem Solver &middot; Systems Thinker
              <span className="w-8 h-px bg-slate-600" />
            </div>
          </div>

          {/* Main headline */}
          <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.92] tracking-tight font-bold">
            <span className="animate-fade-up block text-slate-100">
              I turn
            </span>
            <span className="block mt-2 animate-fade-up delay-100">
              <ScrambleText
                text="complexity"
                delay={600}
                trigger={textReady}
                className="text-lime italic inline-block"
              />
            </span>
            <span className="block mt-2 animate-fade-up delay-200 text-slate-100">
              into{" "}
              <ClipRevealText
                text="clarity"
                delay={2600}
                trigger={textReady}
                className="text-lime italic"
              />
            </span>
          </h1>

          {/* Subtext — separate parallax rate */}
          <div
            style={{
              transform: `translateY(${subParallax * 0.5}px)`,
              opacity: subOpacity,
            }}
          >
            <p className="animate-fade-up delay-400 mt-10 md:mt-14 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              I design products and systems that make the complex feel simple —
              blending strategy, structure, and human-centered thinking.
            </p>

            <div className="animate-fade-up delay-500 mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
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

        {/* Bottom HUD */}
        <div className="absolute bottom-8 left-0 right-0 px-6 md:px-12 flex items-end justify-between pointer-events-none">
          {/* State label */}
          <div className="animate-fade-in delay-600">
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full transition-all duration-700"
                style={{
                  backgroundColor:
                    meshProgress < 0.5
                      ? "rgba(154, 171, 178, 0.4)"
                      : "rgba(194, 224, 58, 0.9)",
                  boxShadow:
                    meshProgress > 0.5
                      ? "0 0 10px rgba(194, 224, 58, 0.5)"
                      : "none",
                }}
              />
              <span className="text-xs tracking-[0.15em] uppercase font-medium text-slate-500 transition-colors duration-700">
                {meshProgress < 0.5 ? "Complexity" : "Clarity"}
              </span>
            </div>
          </div>

          {/* Scroll progress bar */}
          <div className="animate-fade-in delay-600 flex flex-col items-center gap-2">
            <span className="text-[10px] tracking-widest uppercase text-slate-600">
              Scroll
            </span>
            <div className="relative w-px h-16 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="absolute bottom-0 left-0 w-full bg-lime/60 rounded-full"
                style={{ height: `${meshProgress * 100}%` }}
              />
            </div>
          </div>

          {/* Progress counter */}
          <div className="animate-fade-in delay-600">
            <span className="text-xs tabular-nums tracking-widest text-slate-600 font-mono">
              {String(Math.round(meshProgress * 100)).padStart(3, "0")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
