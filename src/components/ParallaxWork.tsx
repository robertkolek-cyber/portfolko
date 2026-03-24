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
  const titleRef        = useRef<HTMLDivElement>(null);
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
    const titleEl      = titleRef.current;
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
      const isCompact     = window.innerWidth < 1440;

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

      // Big title — magnetized above the first tile's top edge
      if (titleEl) {
        const firstTiming = getTiming(0);
        const fadeIn  = Math.min(1, Math.max(0, (progress - 0.04) / 0.04));

        // Read the first tile's actual rendered position
        const firstTileEl = tileRefs.current[0];
        const article = firstTileEl?.querySelector("article");
        if (article) {
          const tileRect = article.getBoundingClientRect();
          const gap = 24; // px gap between title bottom and tile top
          // Position title so its bottom edge sits `gap` px above tile's top
          const titleBottom = tileRect.top - gap;
          // Title is absolutely positioned; set bottom of title to this Y
          titleEl.style.left   = "0";
          titleEl.style.right  = "0";
          titleEl.style.top    = "auto";
          titleEl.style.bottom = `${window.innerHeight - titleBottom}px`;

          // Fade out once title top goes above viewport
          const titleH = titleEl.getBoundingClientRect().height;
          const titleTop = titleBottom - titleH;
          const fadeOut = Math.min(1, Math.max(0, -titleTop / 40));

          titleEl.style.opacity = String(fadeIn * (1 - fadeOut));
        }
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

        // On compact screens (13"), tiles drift sideways sooner with a mid-point kick
        const midOut  = center + (end - center) * (isCompact ? 0.25 : 0.5);
        const xVw     = isCompact
          ? interpolate(progress, [start, center, midOut, end],
              isEven ? [-3, -12, -120, -250] : [3, 12, 120, 250])
          : interpolate(progress, [start, center, end],
              isEven ? [-5, -20, -250] : [5, 20, 250]);

        el.style.opacity   = String(opacity);
        el.style.transform = `translateX(${xVw}vw) scale(${scale})`;
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
          const dotActive = isCompact ? "22px" : "28px";
          const dotInactive = isCompact ? "6px" : "8px";
          dot.style.width           = isActive ? dotActive : dotInactive;
          dot.style.height          = isCompact ? "6px" : "8px";
          dot.style.backgroundColor = isActive ? "#2563eb" : "#94a3b8";
          dot.style.opacity         = isActive ? "1" : "0.45";
        }
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

        {/* Big title — magnetized above first tile */}
        <div
          ref={titleRef}
          className="absolute z-[25] pointer-events-none"
          style={{ opacity: 0 }}
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg sm:text-xl md:text-2xl lg:text-3xl leading-[1.1] font-bold text-slate-800 text-center whitespace-nowrap">
            Projects that <span className="italic text-lime">define</span> my craft.
          </h2>
        </div>

        {/* Soft white fog behind heading — tiles disappear behind it */}
        <div
          ref={headingRef}
          className="absolute inset-x-0 bottom-12 z-[400] pointer-events-none"
          style={{ opacity: 0 }}
        >
          {/* Blurry gradient backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, rgba(240,243,250,1) 0%, rgba(240,243,250,0.95) 25%, rgba(240,243,250,0.5) 45%, rgba(240,243,250,0) 65%)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              maskImage: "linear-gradient(to top, black 0%, black 30%, transparent 65%)",
              WebkitMaskImage: "linear-gradient(to top, black 0%, black 30%, transparent 65%)",
            }}
          />
          {/* Text content */}
          <div className="relative z-10 text-center pb-8 md:pb-14 lg:pb-8 2xl:pb-14 pt-10 md:pt-20 lg:pt-12 2xl:pt-20">
            <p className="text-[10px] md:text-xs lg:text-[8px] xl:text-[10px] 2xl:text-xs tracking-[0.3em] uppercase text-slate-400 font-medium">
              Selected Work
            </p>
          </div>
        </div>

        {/* Project indicator — bottom center, dots + counter */}
        <div
          ref={indicatorRef}
          className="absolute bottom-8 inset-x-0 z-[500] flex items-center justify-center gap-6"
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
                <article className="w-[80vw] sm:w-[65vw] md:w-[55vw] lg:w-[38vw] xl:w-[40vw] 2xl:w-[55vw] max-w-2xl">
                  {(() => {
                    const pastelGradients = [
                      "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
                      "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
                      "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                      "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
                    ];
                    return (
                      <div
                        className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 md:mb-6 border border-slate-200/60"
                        style={{ background: pastelGradients[i % pastelGradients.length] }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                          <span className="text-lime text-sm font-medium tracking-wide">View case study</span>
                          <svg className="w-5 h-5 text-lime" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                          </svg>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl 2xl:text-3xl font-semibold text-slate-800 group-hover:text-lime transition-colors duration-300">
                        Project {i + 1}
                      </h3>
                      <p className="mt-1 md:mt-1.5 text-slate-500 text-xs sm:text-sm md:text-base lg:text-xs xl:text-sm 2xl:text-base leading-relaxed">
                        {project.tagline}
                      </p>
                    </div>
                    <span className="flex-shrink-0 mt-1 text-[10px] md:text-xs lg:text-[8px] xl:text-[10px] 2xl:text-xs tracking-wide uppercase text-slate-400 font-medium">
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
          <div className="w-[85vw] sm:w-[80vw] max-w-2xl text-center">
            <p className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-slate-400 font-medium mb-4 md:mb-6">
              Let&apos;s collaborate
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl md:text-5xl lg:text-4xl xl:text-5xl 2xl:text-7xl leading-[1.05] font-bold text-slate-800 mb-6 md:mb-8">
              Got a project in mind?
              <br />
              <span className="italic text-lime">Let&apos;s talk.</span>
            </h2>
            <a
              href="mailto:hello@robertkolek.com"
              className="group inline-flex items-center gap-2 md:gap-3 bg-lime text-dark-950 px-6 md:px-10 lg:px-6 xl:px-8 2xl:px-10 py-3 md:py-4 lg:py-3 2xl:py-4 rounded-full text-sm md:text-base lg:text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide hover:bg-lime-light transition-colors duration-300 glow-lime mb-8 md:mb-12"
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
                  className="text-sm lg:text-xs 2xl:text-sm text-slate-400 hover:text-lime transition-colors duration-300 link-underline"
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
