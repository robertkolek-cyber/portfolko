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
  const indicatorRef    = useRef<HTMLDivElement>(null);
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
    const indicatorEl  = indicatorRef.current;
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

    // Smoothstep for opacity fades — no sharp edges
    const smoothstep = (edge0: number, edge1: number, x: number) => {
      const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
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

        underwaterEl.style.background = `rgb(240,243,250)`;
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

      // Project tiles — continuous parametric curves, no piecewise keyframes
      for (let i = 0; i < total; i++) {
        const el = tileRefs.current[i];
        if (!el) continue;

        const { start, center, end } = getTiming(i);
        const isEven = i % 2 === 0;
        const sign = isEven ? -1 : 1;

        // Normalized 0→1 over the tile's full lifetime
        const t = Math.max(0, Math.min(1, (progress - start) / (end - start)));
        // Where center falls in normalized time
        const tCenter = (center - start) / (end - start);

        // Scale: continuous curve peaking at 1 at center, growing to 3.5 at exit
        const scale = t < tCenter
          ? 0.3 + 0.7 * Math.pow(t / tCenter, 1.6)
          : 1.0 + 2.5 * Math.pow((t - tCenter) / (1 - tCenter), 1.4);

        // ── Curved trajectory ──
        // The tile follows a parametric arc, not a straight line.
        // X: accelerating sideways (power curve)
        // Y: sinusoidal arc — rises upward, peaks mid-flight, descends as it exits
        // Together they trace a smooth parabolic sweep.
        const xVw = sign * Math.pow(t, 2.0) * 200;
        const yVh = -Math.sin(t * Math.PI) * 18          // arc: 0 → -18vh → 0
                     + Math.pow(t, 3) * 10;               // slight downward pull at exit

        // Opacity: smoothstep in, hold, smoothstep out
        const opIn  = smoothstep(0, 0.15, t);
        const opOut = 1 - smoothstep(0.7, 0.92, t);
        const opacity = opIn * opOut;

        el.style.opacity   = String(opacity);
        el.style.transform = `translate(${xVw}vw, ${yVh}vh) scale(${scale})`;
        el.style.zIndex    = String(Math.round(scale * 100));
      }

      // Project indicator — fade in/out, update dots + counter
      {
        const firstTiming = getTiming(0);
        const ctaTiming   = getTiming(total);
        const indIn  = Math.min(1, Math.max(0, (progress - firstTiming.start) / 0.04));
        const indOut = Math.min(1, Math.max(0, (progress - ctaTiming.start)   / 0.04));
        const indOp  = indIn * (1 - indOut);
        if (indicatorEl) indicatorEl.style.opacity = String(indOp);

        // Active dot switches early — biased 30% before center toward the start
        let activeIndex = 0;
        let minDist = Infinity;
        for (let i = 0; i < total; i++) {
          const { start, center } = getTiming(i);
          const biased = start + (center - start) * 0.7;
          const dist = Math.abs(progress - biased);
          if (dist < minDist) { minDist = dist; activeIndex = i; }
        }

        // Update dots
        for (let i = 0; i < total; i++) {
          const dot = dotItemRefs.current[i];
          if (!dot) continue;
          const isActive = i === activeIndex;
          dot.style.width           = isActive ? "28px" : "8px";
          dot.style.backgroundColor = isActive ? "#2563eb" : "#94a3b8";
          dot.style.opacity         = isActive ? "1" : "0.45";
        }
      }

      // CTA slide — last item, stays centered (no lateral drift)
      if (ctaEl) {
        const { start, center, end } = getTiming(total);
        const tCta = Math.max(0, Math.min(1, (progress - start) / (end - start)));
        const scale   = lerp(0.85, 1, smoothstep(0, 0.5, tCta));
        const opacity = smoothstep(0, 0.25, tCta) * (1 - smoothstep(0.75, 1, tCta));

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
      <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ contain: "paint" }}>

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

        {/* "Selected Work" heading — centered, always above project tiles */}
        <div
          ref={headingRef}
          className="absolute inset-x-0 bottom-12 z-[500] text-center pointer-events-none"
          style={{ opacity: 0 }}
        >
          <p className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.3em] uppercase text-slate-400 font-medium mb-1">
            Selected Work
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-sm sm:text-base md:text-lg lg:text-2xl leading-[1.15] font-bold text-slate-800">
            Projects that <span className="italic text-lime">define</span> my craft.
          </h2>
        </div>

        {/* Project indicator — bottom center, dots + counter */}
        <div
          ref={indicatorRef}
          className="absolute bottom-8 inset-x-0 z-40 flex items-center justify-center gap-6"
          style={{ opacity: 0 }}
        >
          {/* Dots */}
          <div className="flex items-center gap-2">
            {projects.map((project, i) => (
              <div
                key={project.slug}
                ref={(el) => { dotItemRefs.current[i] = el; }}
                className="rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: "#94a3b8",
                  opacity: 0.45,
                  transition: "width 0.3s cubic-bezier(0.16,1,0.3,1), background-color 0.3s ease, opacity 0.3s ease",
                }}
              />
            ))}
          </div>
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
                <article className="w-[65vw] max-w-2xl">
                  <div
                    className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-dark-700/50 shadow-2xl mb-4"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover object-right-bottom"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-[family-name:var(--font-display)] text-white/80 text-5xl md:text-7xl font-bold select-none">
                          {project.title}
                        </span>
                      </div>
                    )}
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
                      <h3 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-semibold text-slate-800 group-hover:text-lime transition-colors duration-300">
                        {project.title}
                      </h3>
                      <p className="mt-1 text-slate-500 text-xs md:text-sm leading-relaxed">
                        {project.tagline}
                      </p>
                    </div>
                    <span className="flex-shrink-0 mt-1 text-[10px] md:text-xs tracking-wide uppercase text-slate-400 font-medium">
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
