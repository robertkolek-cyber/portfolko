"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Hero from "./Hero";
import { projects } from "@/lib/projects";

/* ── Combined hero + parallax fly-through ──────────────────── */

export default function ParallaxWork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroWrapperRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);

  const total = projects.length;

  useEffect(() => {
    const container = containerRef.current;
    const heroWrapper = heroWrapperRef.current;
    const heading = headingRef.current;
    if (!container) return;

    const step = 0.75 / total;

    const getTiming = (index: number) => {
      // Start tiles at 0.25 so first card is invisible at progress=0
      // (hero fades out 0–5%, tiles begin appearing from ~8%)
      const center = 0.25 + index * step;
      const start = center - step * 1.15;
      const end = center + step * 0.85;
      return { start, center, end };
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const interpolate = (
      progress: number,
      inputs: number[],
      outputs: number[]
    ) => {
      if (progress <= inputs[0]) return outputs[0];
      if (progress >= inputs[inputs.length - 1]) return outputs[outputs.length - 1];
      for (let i = 0; i < inputs.length - 1; i++) {
        if (progress >= inputs[i] && progress <= inputs[i + 1]) {
          const t = (progress - inputs[i]) / (inputs[i + 1] - inputs[i]);
          return lerp(outputs[i], outputs[i + 1], t);
        }
      }
      return outputs[outputs.length - 1];
    };

    const update = () => {
      const rect = container.getBoundingClientRect();
      const containerTop = -rect.top;
      const containerHeight = rect.height - window.innerHeight;
      const progress = Math.max(0, Math.min(1, containerTop / containerHeight));

      // Hero fade-out: 0–5% of scroll
      if (heroWrapper) {
        const heroOpacity = Math.max(0, 1 - progress / 0.05);
        const heroScale = 1 + Math.min(progress / 0.05, 1) * 0.15;
        const heroY = -Math.min(progress / 0.05, 1) * 80;
        heroWrapper.style.opacity = String(heroOpacity);
        heroWrapper.style.transform = `scale(${heroScale}) translateY(${heroY}px)`;
        heroWrapper.style.pointerEvents = progress > 0.03 ? "none" : "auto";
      }

      // "Selected Work" heading: appears 5–10%, fades out 10–15%
      if (heading) {
        let hOpacity = 0;
        if (progress < 0.05) {
          hOpacity = 0;
        } else if (progress < 0.10) {
          hOpacity = (progress - 0.05) / 0.05; // fade in
        } else if (progress < 0.15) {
          hOpacity = 1 - (progress - 0.10) / 0.05; // fade out
        }
        const hScale = 1 + Math.max(0, (progress - 0.10) / 0.05) * 0.1;
        const hBlur = Math.max(0, (progress - 0.10) / 0.05) * 10;
        heading.style.opacity = String(Math.max(0, hOpacity));
        heading.style.transform = `scale(${Math.min(hScale, 1.1)})`;
        heading.style.filter = `blur(${Math.min(Math.max(0, hBlur), 10)}px)`;
        heading.style.display = progress > 0.16 ? "none" : "flex";
      }

      // Tiles fly through
      for (let i = 0; i < total; i++) {
        const el = tileRefs.current[i];
        if (!el) continue;

        const { start, center, end } = getTiming(i);
        const isEven = i % 2 === 0;

        const scale = interpolate(progress, [start, center, end], [0.3, 1, 3.5]);

        const opIn = start + (center - start) * 0.3;
        const opOut = end - (end - center) * 0.2;
        const opacity = interpolate(
          progress,
          [start, opIn, center, opOut, end],
          [0, 1, 1, 1, 0]
        );

        const xVw = interpolate(
          progress,
          [start, center, end],
          isEven ? [-5, -35, -120] : [5, 35, 120]
        );

        const z = Math.round(scale * 100);

        el.style.opacity = String(opacity);
        el.style.transform = `translateX(${xVw}vw) scale(${scale})`;
        el.style.zIndex = String(z);
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [total]);

  return (
    <section id="work" ref={containerRef} className="relative h-[800vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Hero — visible at top, fades out on scroll */}
        <div ref={heroWrapperRef} className="absolute inset-0 z-20">
          <Hero />
        </div>

        {/* "Selected Work" heading — fades in after hero, then out */}
        <div
          ref={headingRef}
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ opacity: 0 }}
        >
          <div className="text-center px-6">
            <p className="text-sm tracking-[0.3em] uppercase text-slate-500 font-medium mb-4">
              Selected Work
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl lg:text-6xl leading-[1.1] font-bold text-slate-100">
              Projects that
              <br />
              <span className="italic text-lime">define</span> my craft.
            </h2>
          </div>
        </div>

        {/* Project tiles — fly through */}
        {projects.map((project, i) => (
          <div
            key={project.slug}
            ref={(el) => { tileRefs.current[i] = el; }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: 0, pointerEvents: "none" }}
          >
            <div style={{ pointerEvents: "auto" }}>
              <Link href={`/projects/${project.slug}`} className="group block">
                <article className="w-[80vw] max-w-3xl">
                  <div
                    className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6 border border-dark-700/50"
                    style={{ backgroundColor: project.color }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-[family-name:var(--font-display)] text-white/80 text-5xl md:text-7xl font-bold select-none">
                        {project.title}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                      <span className="text-lime text-sm font-medium tracking-wide">
                        View case study
                      </span>
                      <svg
                        className="w-5 h-5 text-lime"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-semibold text-slate-100 group-hover:text-lime transition-colors duration-300">
                        {project.title}
                      </h3>
                      <p className="mt-1.5 text-slate-400 text-sm md:text-base leading-relaxed">
                        {project.tagline}
                      </p>
                    </div>
                    <span className="flex-shrink-0 mt-1 text-xs tracking-wide uppercase text-slate-500 font-medium">
                      {project.category}
                    </span>
                  </div>
                </article>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
