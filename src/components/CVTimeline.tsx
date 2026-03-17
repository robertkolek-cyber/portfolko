"use client";

import { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   CV TIMELINE — "Chaos to Clarity" entrance
   ONE rAF LOOP. ONE complexity parameter. EVERY value is a
   smooth function of time. Matches Hero design language.
   ═══════════════════════════════════════════════════════════════ */

const experiences = [
  {
    period: "2023 — Present",
    role: "Senior Product Designer",
    company: "Freelance",
    description:
      "End-to-end product design for startups and scale-ups across fintech, health, and SaaS verticals. Leading strategy, research, and delivery.",
    tags: ["Product Strategy", "UX Research", "Systems"],
  },
  {
    period: "2021 — 2023",
    role: "Lead UX Designer",
    company: "Studio Atlas",
    description:
      "Led design systems and UX strategy for B2B platforms serving 200k+ active users. Built component libraries adopted across 6 product teams.",
    tags: ["Design Systems", "B2B", "Leadership"],
  },
  {
    period: "2019 — 2021",
    role: "UI/UX Designer",
    company: "Forma Agency",
    description:
      "Designed digital products and brand experiences for global clients. Delivered across e-commerce, media, and financial services sectors.",
    tags: ["UI Design", "Branding", "Web"],
  },
  {
    period: "2017 — 2019",
    role: "Visual Designer",
    company: "Pixel Lab",
    description:
      "Built visual identities and interactive prototypes for early-stage tech companies. Bridged the gap between brand and product.",
    tags: ["Identity", "Motion", "Prototyping"],
  },
  {
    period: "2015 — 2017",
    role: "Junior Designer",
    company: "Craft Studio",
    description:
      "Started as an apprentice and quickly owned projects across print, digital, and brand design. Foundation in craft and attention to detail.",
    tags: ["Print", "Digital", "Brand"],
  },
];

/* ── Depth opacities — perspective on the timeline ─────────── */
const BASE_OPACITIES = [1, 0.6, 0.25, 0.1, 0.05];
const LINE_WIDTH = experiences.length * 450 + 400;

/* ── Easing ─────────────────────────────────────────────────── */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

function smoothstepVal(t: number) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/* ── Card ───────────────────────────────────────────────────── */

function Card({ exp }: { exp: (typeof experiences)[0] }) {
  return (
    <div className="w-[300px]">
      <p className="text-[10px] tracking-[0.28em] uppercase font-medium mb-3" style={{ color: "#64748b" }}>
        {exp.period}
      </p>
      <h3 className="font-[family-name:var(--font-display)] text-xl font-bold leading-snug mb-1" style={{ color: "#e2e8f0" }}>
        {exp.role}
      </h3>
      <p className="text-sm font-semibold mb-4" style={{ color: "#60a5fa" }}>{exp.company}</p>
      <p className="text-sm leading-relaxed mb-5" style={{ color: "#94a3b8" }}>{exp.description}</p>
      <div className="flex flex-wrap gap-2">
        {exp.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] tracking-widest uppercase px-2.5 py-[3px] rounded-full"
            style={{ color: "#64748b", borderColor: "rgba(148,163,184,0.2)", borderWidth: 1 }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Timeline Component ─────────────────────────────────────── */

export default function CVTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [entered, setEntered] = useState(false);
  const entranceDoneRef = useRef(false);
  const entranceRaf = useRef(0);
  const scrollRaf = useRef(false);

  /* ── Trigger on visibility ────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setEntered(true); obs.disconnect(); }
      },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── Entrance: single rAF loop — chaos → clarity ──────────── */
  useEffect(() => {
    if (!entered) return;
    const start = performance.now();

    // Timing constants
    const FADE_IN = 0.35;       // wrapper fade-in duration
    const RESOLVE_START = 0.5;  // when chaos begins resolving
    const RESOLVE_DUR = 2.2;    // how long the resolve takes
    const TOTAL = RESOLVE_START + RESOLVE_DUR;

    const tick = (now: number) => {
      const t = (now - start) / 1000;

      // ── Master complexity: 1 → 0 ──
      let complexity: number;
      if (t < RESOLVE_START) {
        complexity = 1.0;
      } else {
        const raw = Math.min(1, (t - RESOLVE_START) / RESOLVE_DUR);
        complexity = 1 - easeOutCubic(raw);
      }

      // ── Wrapper fade-in ──
      const wrapper = wrapperRef.current;
      if (wrapper) {
        wrapper.style.opacity = String(Math.min(1, t / FADE_IN));
      }

      // ── Label + download link ──
      const labelAlpha = smoothstep(0.25, 0.8, t);
      const labelY = 8 * (1 - labelAlpha);
      if (labelRef.current) {
        labelRef.current.style.opacity = String(labelAlpha);
        labelRef.current.style.transform = `translateY(${labelY}px)`;
      }
      if (downloadRef.current) {
        const dlAlpha = smoothstep(0.35, 0.9, t);
        downloadRef.current.style.opacity = String(dlAlpha);
        downloadRef.current.style.transform = `translateY(${8 * (1 - dlAlpha)}px)`;
      }

      // ── Timeline line: noisy SVG path → straight ──
      const line = lineRef.current;
      if (line) {
        const segments = 180;
        let d = "";
        for (let s = 0; s <= segments; s++) {
          const nx = s / segments;
          const x = nx * LINE_WIDTH;
          // Four-octave layered sine noise
          const noise = (
            Math.sin(nx * 14 + t * 2.5) * 20 +
            Math.sin(nx * 28 + t * 1.7 + 1.3) * 11 +
            Math.sin(nx * 55 + t * 3.4 + 2.7) * 5.5 +
            Math.sin(nx * 110 + t * 5.0 + 0.5) * 2.5
          ) * complexity;
          d += s === 0 ? `M${x},${noise}` : ` L${x},${noise}`;
        }
        line.setAttribute("d", d);
        // Line fades in fast
        line.style.opacity = String(Math.min(1, t / 0.25));
      }

      // ── Line glow: pulses during chaos, fades with clarity ──
      if (glowRef.current) {
        const pulse = 0.5 + Math.sin(t * 3) * 0.3;
        const glowAlpha = complexity * pulse * 0.15;
        const blur = 30 + complexity * 40;
        glowRef.current.style.opacity = String(glowAlpha);
        glowRef.current.style.filter = `blur(${blur}px)`;
      }

      // ── Dots: jitter + pulse during chaos, settle into place ──
      dotRefs.current.forEach((dot, i) => {
        if (!dot) return;
        const baseOp = BASE_OPACITIES[i] ?? 0.05;

        // Dots appear fast (0.3s stagger)
        const dotFade = Math.min(1, Math.max(0, (t - 0.1 - i * 0.06) / 0.3));

        // Position jitter — each dot has its own phase offset
        const jX = Math.sin(t * 3.5 + i * 1.7) * 8 * complexity;
        const jY = Math.cos(t * 2.8 + i * 2.1) * 12 * complexity;

        // Scale pulse
        const scale = 1 + Math.sin(t * 4.5 + i * 0.9) * 0.4 * complexity;

        // Glow ring: bright during chaos, settles to static ring
        const glowPulse = 0.25 + complexity * 0.35 * (0.5 + 0.5 * Math.sin(t * 5 + i * 1.2));

        dot.style.transform = `translate(${jX}px, ${jY}px) scale(${scale})`;
        dot.style.opacity = String(dotFade * baseOp);
        dot.style.boxShadow = `0 0 0 4px rgba(96, 165, 250, ${glowPulse})`;
      });

      // ── Cards: emerge as chaos subsides ──
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const baseOp = BASE_OPACITIES[i] ?? 0.05;

        // Cards wait for chaos to drop, then ease in (staggered per item)
        const cardThreshold = 0.55 - i * 0.06;
        const cardProgress = smoothstep(0.7, cardThreshold, complexity);
        const isAbove = i % 2 === 0;
        const yDrift = (1 - cardProgress) * (isAbove ? 10 : -10);

        el.style.opacity = String(cardProgress * baseOp);
        el.style.transform = `translateY(${yDrift}px)`;
      });

      // ── Continue or finish ──
      if (t < TOTAL + 0.1) {
        entranceRaf.current = requestAnimationFrame(tick);
      } else {
        // Set clean final states
        entranceDoneRef.current = true;
        if (line) {
          line.setAttribute("d", `M0,0 L${LINE_WIDTH},0`);
          line.style.opacity = "1";
        }
        if (glowRef.current) glowRef.current.style.opacity = "0";
        dotRefs.current.forEach((dot, i) => {
          if (!dot) return;
          dot.style.transform = "translate(0,0) scale(1)";
          dot.style.opacity = String(BASE_OPACITIES[i] ?? 0.05);
          dot.style.boxShadow = "0 0 0 4px rgba(96, 165, 250, 0.25)";
        });
        itemRefs.current.forEach((el, i) => {
          if (!el) return;
          el.style.opacity = String(BASE_OPACITIES[i] ?? 0.05);
          el.style.transform = "translateY(0)";
        });
      }
    };

    entranceRaf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(entranceRaf.current);
  }, [entered]);

  /* ── Scroll-driven horizontal parallax (after entrance) ───── */
  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const setHeight = () => {
      const travel = Math.max(0, track.scrollWidth - window.innerWidth);
      container.style.height = `${travel + window.innerHeight}px`;
    };
    setHeight();
    window.addEventListener("resize", setHeight);

    const update = () => {
      if (!entranceDoneRef.current) return;

      const rect = container.getBoundingClientRect();
      const scrolled = -rect.top;
      const scrollable = container.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const p = Math.max(0, Math.min(1, scrolled / scrollable));

      // Move track horizontally
      const travel = track.scrollWidth - window.innerWidth;
      track.style.transform = `translateX(${-p * travel}px)`;

      // Items: interpolate from base opacity → 1.0
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const threshold = i === 0 ? 0 : (i / (experiences.length - 1)) * 0.75;
        const t = smoothstepVal((p - threshold) / 0.2);
        const baseOp = BASE_OPACITIES[i] ?? 0.05;
        const opacity = baseOp + (1 - baseOp) * t;
        const isAbove = i % 2 === 0;
        const yOffset = (1 - t) * (isAbove ? 14 : -14) * (1 - baseOp);
        el.style.opacity = String(opacity);
        el.style.transform = `translateY(${yOffset}px)`;
      });

      // Dots follow same opacity
      dotRefs.current.forEach((dot, i) => {
        if (!dot) return;
        const threshold = i === 0 ? 0 : (i / (experiences.length - 1)) * 0.75;
        const t = smoothstepVal((p - threshold) / 0.2);
        const baseOp = BASE_OPACITIES[i] ?? 0.05;
        dot.style.opacity = String(baseOp + (1 - baseOp) * t);
      });
    };

    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", setHeight);
    };
  }, [entered]);

  return (
    <section
      ref={containerRef}
      id="cv"
      className="relative"
      style={{ backgroundColor: "#0f1d3d", marginTop: "-2rem" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Content wrapper — fades in via rAF, no CSS transition */}
        <div ref={wrapperRef} className="absolute inset-0" style={{ opacity: 0 }}>
          {/* Section label */}
          <div
            ref={labelRef}
            className="absolute top-10 left-10 z-20 pointer-events-none"
            style={{ opacity: 0, transform: "translateY(8px)" }}
          >
            <p className="text-xs tracking-[0.3em] uppercase font-medium" style={{ color: "#64748b" }}>
              Experience
            </p>
          </div>

          {/* Download CV */}
          <div
            ref={downloadRef}
            className="absolute top-10 right-10 z-20"
            style={{ opacity: 0, transform: "translateY(8px)" }}
          >
            <a
              href="/cv.pdf"
              download
              className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase hover:text-lime transition-colors duration-300 font-medium"
              style={{ color: "#64748b" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download CV
            </a>
          </div>

          {/* Horizontal track */}
          <div
            ref={trackRef}
            className="absolute inset-y-0 left-0 flex"
            style={{ paddingLeft: "10vw", paddingRight: "18vw", gap: "5vw", willChange: "transform" }}
          >
            {/* Timeline line — SVG path driven by rAF (chaos → straight) */}
            <svg
              className="absolute top-1/2 left-0 pointer-events-none overflow-visible"
              style={{ width: `${LINE_WIDTH}px`, height: "1px" }}
            >
              <path
                ref={lineRef}
                d="M0,0"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
                fill="none"
                style={{ opacity: 0 }}
              />
            </svg>

            {/* Atmospheric glow behind the line — pulses during chaos */}
            <div
              ref={glowRef}
              className="absolute top-1/2 left-[10%] right-[10%] h-px pointer-events-none -translate-y-1/2"
              style={{
                opacity: 0,
                background: "linear-gradient(to right, transparent, rgba(96, 165, 250, 0.6) 20%, rgba(163, 230, 53, 0.4) 50%, rgba(96, 165, 250, 0.6) 80%, transparent)",
                height: "2px",
              }}
            />

            {experiences.map((exp, i) => {
              const isAbove = i % 2 === 0;
              return (
                <div
                  key={i}
                  className="relative flex-shrink-0 h-screen flex flex-col"
                  style={{ width: 340 }}
                >
                  {/* Card area — opacity/transform driven by rAF + scroll */}
                  <div
                    ref={(el) => { itemRefs.current[i] = el; }}
                    className="absolute inset-0 flex flex-col"
                    style={{ opacity: 0, transform: `translateY(${isAbove ? 10 : -10}px)` }}
                  >
                    <div className="flex-1 flex flex-col justify-end pb-10">
                      {isAbove && <Card exp={exp} />}
                    </div>
                    <div className="flex-1 flex flex-col justify-start pt-10" style={{ marginTop: "12px" }}>
                      {!isAbove && <Card exp={exp} />}
                    </div>
                  </div>

                  {/* Dot — jitters during chaos, settles with clarity */}
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 z-10">
                    <div
                      ref={(el) => { dotRefs.current[i] = el; }}
                      className="w-3 h-3 rounded-full bg-lime"
                      style={{
                        transform: "translate(0,0) scale(0)",
                        opacity: 0,
                        boxShadow: "0 0 0 4px rgba(96, 165, 250, 0.25)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
