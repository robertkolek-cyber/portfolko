"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Hero from "./Hero";
import { projects } from "@/lib/projects";

/* ── F1-style depth fly-through ────────────────────────────────
   Cards emerge from center background (tiny), scale up toward the
   viewer, then blast past. Multiple cards visible simultaneously
   at different depths. Minimal horizontal drift — pure Z-axis feel.
   ─────────────────────────────────────────────────────────────── */

// Slight positional stagger per card [xVw, yPct]
// Gives the "gallery in space" look — not a single straight lane
const CARD_OFFSETS = [
  [-8,  -4],  // 0: slightly left, slightly up
  [ 6,   5],  // 1: slightly right, slightly down
  [-4,   3],  // 2: center-left, slightly down
  [ 9,  -6],  // 3: right, slightly up
];

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

    // Each card occupies this fraction of the total scroll
    const step = 0.7 / total;

    const getTiming = (index: number) => {
      const center = 0.22 + index * step;
      // Wide entry window so multiple cards are visible at once
      const start = center - step * 1.4;
      const end   = center + step * 0.9;
      return { start, center, end };
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const interpolate = (progress: number, inputs: number[], outputs: number[]) => {
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

      // Hero: fades out 0–5%
      if (heroWrapper) {
        const p = Math.min(1, progress / 0.05);
        heroWrapper.style.opacity = String(Math.max(0, 1 - p));
        heroWrapper.style.transform = `scale(${1 + p * 0.12}) translateY(${-p * 60}px)`;
        heroWrapper.style.pointerEvents = progress > 0.03 ? "none" : "auto";
      }

      // Heading: stays visible from 5% onward while tiles are showing
      if (heading) {
        const fadeIn = Math.min(1, Math.max(0, (progress - 0.05) / 0.05));
        // Fade out only at very end (after all tiles pass)
        const fadeOut = Math.min(1, Math.max(0, (progress - 0.88) / 0.06));
        heading.style.opacity = String(fadeIn * (1 - fadeOut));
        heading.style.display = fadeIn === 0 && fadeOut === 1 ? "none" : "block";
      }

      // Tiles
      for (let i = 0; i < total; i++) {
        const el = tileRefs.current[i];
        if (!el) continue;

        const { start, center, end } = getTiming(i);
        const [xOffset, yOffset] = CARD_OFFSETS[i % CARD_OFFSETS.length];

        // Pure depth: starts tiny (far away), peaks at ~90% size, blasts past
        const scale = interpolate(progress,
          [start, center, end],
          [0.08, 0.88, 2.6]
        );

        // Subtle X drift — feels like natural 3D parallax, not a slide
        const x = interpolate(progress,
          [start, center, end],
          [xOffset * 0.3, xOffset, xOffset * 1.8]  // vw
        );

        // Subtle Y — card floats in from slightly above/below
        const y = interpolate(progress,
          [start, center, end],
          [yOffset * 0.5, yOffset, yOffset * 1.5]  // %
        );

        // Opacity: fast fade in, long hold, quick fade out as it blasts past
        const opIn  = start + (center - start) * 0.25;
        const opOut = end   - (end - center)   * 0.30;
        const opacity = interpolate(progress,
          [start, opIn, center, opOut, end],
          [0, 1, 1, 1, 0]
        );

        // z-index: bigger = closer = on top
        const z = Math.round(scale * 100);

        el.style.opacity = String(opacity);
        el.style.transform = `translateX(${x}vw) translateY(${y}%) scale(${scale})`;
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

        {/* Hero — fades out on first scroll */}
        <div ref={heroWrapperRef} className="absolute inset-0 z-20">
          <Hero />
        </div>

        {/* Persistent label — bottom-left during tile sequence */}
        <div
          ref={headingRef}
          className="absolute bottom-10 left-10 z-30"
          style={{ opacity: 0 }}
        >
          <p className="text-xs tracking-[0.3em] uppercase text-slate-500 font-medium mb-2">
            Selected Work
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl leading-[1.1] font-bold text-slate-100">
            Projects that <span className="italic text-lime">define</span> my craft.
          </h2>
        </div>

        {/* Project tiles — depth fly-through */}
        {projects.map((project, i) => (
          <div
            key={project.slug}
            ref={(el) => { tileRefs.current[i] = el; }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: 0, pointerEvents: "none", willChange: "transform, opacity" }}
          >
            <div style={{ pointerEvents: "auto" }}>
              <Link href={`/projects/${project.slug}`} className="group block">
                <article className="w-[55vw] max-w-2xl">
                  {/* Card image */}
                  <div
                    className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-5"
                    style={{ backgroundColor: project.color }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-[family-name:var(--font-display)] text-white/70 text-5xl md:text-6xl font-bold select-none">
                        {project.title}
                      </span>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                    <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-all duration-400 translate-y-2 group-hover:translate-y-0">
                      <span className="text-white text-sm font-medium tracking-wide">
                        View case study →
                      </span>
                    </div>
                  </div>

                  {/* Card info */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-semibold text-slate-100 group-hover:text-lime transition-colors duration-300">
                        {project.title}
                      </h3>
                      <p className="mt-1 text-slate-400 text-sm leading-relaxed">
                        {project.tagline}
                      </p>
                    </div>
                    <span className="flex-shrink-0 mt-1 text-[10px] tracking-widest uppercase text-slate-500 font-medium">
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
