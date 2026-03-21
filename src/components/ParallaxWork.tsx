"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Hero from "./Hero";
import { projects } from "@/lib/projects";

const SOCIALS = [
  { label: "LinkedIn",  href: "#" },
  { label: "Dribbble",  href: "#" },
  { label: "Behance",   href: "#" },
  { label: "Instagram", href: "#" },
];

export default function ParallaxWork() {
  const containerRef    = useRef<HTMLDivElement>(null);
  const heroWrapperRef  = useRef<HTMLDivElement>(null);
  const depthRef        = useRef<HTMLDivElement>(null);
  const underwaterRef   = useRef<HTMLDivElement>(null);
  const headingRef      = useRef<HTMLDivElement>(null);
  const tileRefs        = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef          = useRef<HTMLDivElement>(null);
  const dotsRef         = useRef<HTMLDivElement>(null);
  const dotItemRefs     = useRef<(HTMLDivElement | null)[]>([]);

  const [heroScroll, setHeroScroll] = useState(0);

  const total     = projects.length;
  const allItems  = total + 1; // +1 for the CTA slide

  useEffect(() => {
    const container    = containerRef.current;
    const heroWrapper  = heroWrapperRef.current;
    const depthEl      = depthRef.current;
    const underwaterEl = underwaterRef.current;
    const heading      = headingRef.current;
    const ctaEl        = ctaRef.current;
    const dotsEl       = dotsRef.current;
    if (!container) return;

    const step = 0.75 / allItems;
    let hasSnapped = false;

    const getTiming = (index: number) => {
      const center = 0.25 + index * step;
      const start  = center - step * 1.15;
      const end    = center + step * 0.85;
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
      const rect          = container.getBoundingClientRect();
      const containerTop  = -rect.top;
      const containerH    = rect.height - window.innerHeight;
      const progress      = Math.max(0, Math.min(1, containerTop / containerH));

      // Pass scroll progress to Hero for dive animation
      setHeroScroll(progress);

      // Hero wrapper — pointer events off once scrolling
      if (heroWrapper) {
        heroWrapper.style.pointerEvents = progress > 0.03 ? "none" : "auto";
      }

      // Underwater background — starts lighter, darkens as you scroll through projects
      if (underwaterEl) {
        const fadeIn = Math.min(1, progress / 0.08);
        underwaterEl.style.opacity = String(fadeIn);

        underwaterEl.style.background = `rgb(255,255,255)`;
      }

      // Depth overlay no longer needed
      if (depthEl) {
        depthEl.style.opacity = "0";
      }

      // "Selected Work" heading — visible while project tiles are running, hides before CTA
      if (heading) {
        const ctaTiming  = getTiming(total); // CTA timing
        const fadeIn     = Math.min(1, Math.max(0, (progress - 0.05) / 0.05));
        const fadeOut    = Math.min(1, Math.max(0, (progress - (ctaTiming.start + 0.01)) / 0.04));
        heading.style.opacity = String(fadeIn * (1 - fadeOut));
        heading.style.display = fadeIn === 0 ? "none" : "block";
      }

      // Project tiles
      for (let i = 0; i < total; i++) {
        const el = tileRefs.current[i];
        if (!el) continue;

        const { start, center, end } = getTiming(i);
        const isEven = i % 2 === 0;

        const scale   = interpolate(progress, [start, center, end], [0.3, 1, 3.5]);
        const opIn    = start + (center - start) * 0.3;
        const opOut   = end   - (end - center)   * 0.2;
        const opacity = interpolate(progress, [start, opIn, center, opOut, end], [0, 1, 1, 1, 0]);
        const xVw     = interpolate(progress, [start, center, end],
          isEven ? [-5, -35, -120] : [5, 35, 120]);

        el.style.opacity   = String(opacity);
        el.style.transform = `translateX(${xVw}vw) scale(${scale})`;
        el.style.zIndex    = String(Math.round(scale * 100));
      }

      // Project dots — fade in with projects, highlight active one
      if (dotsEl) {
        const firstTiming = getTiming(0);
        const ctaTiming   = getTiming(total);
        const dotsIn  = Math.min(1, Math.max(0, (progress - firstTiming.start) / 0.04));
        const dotsOut = Math.min(1, Math.max(0, (progress - ctaTiming.start) / 0.04));
        dotsEl.style.opacity = String(dotsIn * (1 - dotsOut));
      }
      for (let i = 0; i < total; i++) {
        const dot = dotItemRefs.current[i];
        if (!dot) continue;
        const { start, center, end } = getTiming(i);
        // Active when this tile is closest to center stage
        const distFromCenter = Math.abs(progress - center);
        const maxDist = (end - start) / 2;
        const active = Math.max(0, 1 - distFromCenter / maxDist);
        // Dot: small dim circle → larger bright filled circle
        const size   = 4 + active * 4;       // 4px → 8px
        const op     = 0.25 + active * 0.75; // dim → full
        dot.style.width   = `${size}px`;
        dot.style.height  = `${size}px`;
        dot.style.opacity = String(op);
        dot.style.backgroundColor = active > 0.5
          ? "var(--color-lime)"
          : "var(--color-slate-400)";
      }

      // CTA slide — last item, same fly-through but stays centered (no lateral drift)
      if (ctaEl) {
        const { start, center, end } = getTiming(total);
        const scale   = interpolate(progress, [start, center, end], [0.85, 1, 1]);
        const opIn    = start + (center - start) * 0.3;
        const opOut   = end   - (end - center)   * 0.2;
        const opacity = interpolate(progress, [start, opIn, center, opOut, end], [0, 1, 1, 1, 0]);

        ctaEl.style.opacity   = String(opacity);
        ctaEl.style.transform = `scale(${scale})`;
        ctaEl.style.zIndex    = String(Math.round(scale * 100 + 10));
        ctaEl.style.pointerEvents = opacity > 0.1 ? "auto" : "none";

        // Auto-snap to CV section once CTA has fully faded out
        if (opacity <= 0 && progress > end && !hasSnapped) {
          hasSnapped = true;
          const cvSection = document.getElementById("cv");
          if (cvSection) {
            cvSection.scrollIntoView({ behavior: "smooth" });
          }
        }
        // Reset snap flag when scrolling back up
        if (progress < end) {
          hasSnapped = false;
        }
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [total, allItems]);

  return (
    <section id="work" ref={containerRef} className="relative h-[900vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* Underwater background — dark navy, fades in as hero dives away */}
        <div
          ref={underwaterRef}
          className="absolute inset-0 z-0"
          style={{
            opacity: 0,
            background: "radial-gradient(ellipse at 50% 30%, #0a1628 0%, #050c18 60%, #020810 100%)",
          }}
        />

        {/* Depth darkening — sits on top of water, deepens as you scroll down */}
        <div
          ref={depthRef}
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            opacity: 0,
            background: "linear-gradient(to bottom, rgba(2, 8, 20, 0.3) 0%, rgba(3, 10, 28, 0.7) 50%, rgba(5, 12, 24, 0.95) 100%)",
          }}
        />

        {/* Hero */}
        <div ref={heroWrapperRef} className="absolute inset-0 z-20">
          <Hero scrollProgress={heroScroll} />
        </div>

        {/* "Selected Work" heading — centered, visible through project tiles */}
        <div
          ref={headingRef}
          className="absolute inset-x-0 bottom-12 z-10 text-center"
          style={{ opacity: 0 }}
        >
          <p className="text-xs tracking-[0.3em] uppercase text-slate-400 font-medium mb-2">
            Selected Work
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl leading-[1.1] font-bold text-slate-800">
            Projects that <span className="italic text-lime">define</span> my craft.
          </h2>
        </div>

        {/* Project progress dots — right edge, visible during project tiles */}
        <div
          ref={dotsRef}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3"
          style={{ opacity: 0 }}
        >
          {projects.map((project, i) => (
            <div
              key={project.slug}
              ref={(el) => { dotItemRefs.current[i] = el; }}
              className="rounded-full transition-none"
              style={{
                width: 4,
                height: 4,
                backgroundColor: "var(--color-slate-400)",
                opacity: 0.25,
              }}
            />
          ))}
        </div>

        {/* Project tiles */}
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
                      <span className="text-lime text-sm font-medium tracking-wide">View case study</span>
                      <svg className="w-5 h-5 text-lime" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-semibold text-slate-800 group-hover:text-lime transition-colors duration-300">
                        {project.title}
                      </h3>
                      <p className="mt-1.5 text-slate-500 text-sm md:text-base leading-relaxed">
                        {project.tagline}
                      </p>
                    </div>
                    <span className="flex-shrink-0 mt-1 text-xs tracking-wide uppercase text-slate-400 font-medium">
                      {project.category}
                    </span>
                  </div>
                </article>
              </Link>
            </div>
          </div>
        ))}

        {/* CTA slide — final frame */}
        <div
          ref={ctaRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className="w-[80vw] max-w-2xl text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-slate-400 font-medium mb-6">
              Let&apos;s collaborate
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl lg:text-7xl leading-[1.05] font-bold text-slate-800 mb-8">
              Got a project in mind?
              <br />
              <span className="italic text-lime">Let&apos;s talk.</span>
            </h2>
            <a
              href="mailto:hello@robertkolek.com"
              className="group inline-flex items-center gap-3 bg-lime text-dark-950 px-10 py-4 rounded-full text-base font-semibold tracking-wide hover:bg-lime-light transition-colors duration-300 glow-lime mb-12"
            >
              hello@robertkolek.com
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <div className="flex items-center justify-center gap-8">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="text-sm text-slate-400 hover:text-lime transition-colors duration-300 link-underline"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
