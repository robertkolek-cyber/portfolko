"use client";

import { useEffect, useRef, useState } from "react";

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

// Resting opacity for each item — creates depth/perspective on the timeline
const BASE_OPACITIES = [1, 0.6, 0.25, 0.1, 0.05];

// Refined ease: smooth deceleration, no bounce/overshoot
const EASE = "cubic-bezier(0.4, 0, 0, 1)";

function smoothstep(t: number) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

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

export default function CVTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [entered, setEntered] = useState(false);
  const scrollStartedRef = useRef(false);

  // Trigger entrance when section becomes visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Entrance choreography — quiet materialization, no sliding
  useEffect(() => {
    if (!entered) return;

    // 1. Timeline line draws itself from left
    const line = lineRef.current;
    if (line) {
      line.style.transition = `transform 1.6s ${EASE} 0.15s`;
      line.style.transform = "scaleX(1)";
    }

    // 2. Dots emerge along the line (scale up from nothing)
    dotRefs.current.forEach((dot, i) => {
      if (!dot) return;
      const delay = 0.4 + i * 0.12;
      dot.style.transition = `transform 0.8s ${EASE} ${delay}s, opacity 0.8s ${EASE} ${delay}s`;
      dot.style.transform = "scale(1)";
      dot.style.opacity = String(BASE_OPACITIES[i] ?? 0.05);
    });

    // 3. Cards fade in with subtle upward drift, staggered after their dots
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const delay = 0.65 + i * 0.12;
      el.style.transition = `opacity 1s ${EASE} ${delay}s, transform 1s ${EASE} ${delay}s`;
      el.style.opacity = String(BASE_OPACITIES[i] ?? 0.05);
      el.style.transform = "translateY(0)";
    });
  }, [entered]);

  // Scroll-driven horizontal parallax
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
      if (!entered) return;

      const rect = container.getBoundingClientRect();
      const scrolled = -rect.top;
      const scrollable = container.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const p = Math.max(0, Math.min(1, scrolled / scrollable));

      // Strip CSS transitions on first scroll so JS takes over cleanly
      if (!scrollStartedRef.current && p > 0.005) {
        scrollStartedRef.current = true;
        itemRefs.current.forEach((el) => { if (el) el.style.transition = "none"; });
        dotRefs.current.forEach((dot) => { if (dot) dot.style.transition = "none"; });
      }

      const travel = track.scrollWidth - window.innerWidth;
      track.style.transform = `translateX(${-p * travel}px)`;

      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const threshold = i === 0 ? 0 : (i / (experiences.length - 1)) * 0.75;
        const t = smoothstep((p - threshold) / 0.2);
        const baseOp = BASE_OPACITIES[i] ?? 0.05;
        const opacity = baseOp + (1 - baseOp) * t;
        const isAbove = i % 2 === 0;
        const yOffset = (1 - t) * (isAbove ? 14 : -14) * (1 - baseOp);
        el.style.opacity = String(opacity);
        el.style.transform = `translateY(${yOffset}px)`;
      });

      // Dots follow same opacity progression
      dotRefs.current.forEach((dot, i) => {
        if (!dot) return;
        const threshold = i === 0 ? 0 : (i / (experiences.length - 1)) * 0.75;
        const t = smoothstep((p - threshold) / 0.2);
        const baseOp = BASE_OPACITIES[i] ?? 0.05;
        const opacity = baseOp + (1 - baseOp) * t;
        dot.style.opacity = String(opacity);
      });
    };

    update();
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
        {/* Content wrapper — fades in quietly, no sliding */}
        <div
          ref={contentRef}
          className="absolute inset-0"
          style={{
            opacity: entered ? 1 : 0,
            transition: `opacity 1.2s ${EASE}`,
          }}
        >
          {/* Section label */}
          <div
            className="absolute top-10 left-10 z-20 pointer-events-none"
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? "translateY(0)" : "translateY(6px)",
              transition: `opacity 0.9s ${EASE} 0.6s, transform 0.9s ${EASE} 0.6s`,
            }}
          >
            <p className="text-xs tracking-[0.3em] uppercase font-medium" style={{ color: "#64748b" }}>
              Experience
            </p>
          </div>

          {/* Download CV link */}
          <div
            className="absolute top-10 right-10 z-20"
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? "translateY(0)" : "translateY(6px)",
              transition: `opacity 0.9s ${EASE} 0.7s, transform 0.9s ${EASE} 0.7s`,
            }}
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
            {/* Timeline line — draws itself from left via scaleX */}
            <div
              ref={lineRef}
              className="absolute top-1/2 left-0 h-px pointer-events-none"
              style={{
                width: `${experiences.length * 450 + 400}px`,
                background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08) 5%, rgba(255,255,255,0.08) 95%, transparent)",
                transform: "scaleX(0)",
                transformOrigin: "left center",
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
                  {/* Card area — managed by itemRefs for entrance + scroll */}
                  <div
                    ref={(el) => { itemRefs.current[i] = el; }}
                    className="absolute inset-0 flex flex-col"
                    style={{
                      opacity: 0,
                      transform: `translateY(${isAbove ? 6 : -6}px)`,
                    }}
                  >
                    <div className="flex-1 flex flex-col justify-end pb-10">
                      {isAbove && <Card exp={exp} />}
                    </div>
                    <div className="flex-1 flex flex-col justify-start pt-10" style={{ marginTop: "12px" }}>
                      {!isAbove && <Card exp={exp} />}
                    </div>
                  </div>

                  {/* Dot — emerges independently via dotRefs */}
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 z-10">
                    <div
                      ref={(el) => { dotRefs.current[i] = el; }}
                      className="w-3 h-3 rounded-full bg-lime"
                      style={{
                        boxShadow: "0 0 0 4px rgba(96, 165, 250, 0.25)",
                        transform: "scale(0)",
                        opacity: 0,
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
