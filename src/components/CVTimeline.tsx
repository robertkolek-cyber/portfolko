"use client";

import { useEffect, useRef } from "react";

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    const label = labelRef.current;
    if (!container || !wrapper || !track) return;

    // Phase 1 uses a short scroll for the entrance (rise from bottom)
    const ENTRANCE_SCREENS = 0.4;

    const setHeight = () => {
      const travel = Math.max(0, track.scrollWidth - window.innerWidth);
      const entranceHeight = window.innerHeight * ENTRANCE_SCREENS;
      // Total = entrance scroll + horizontal travel scroll + one viewport (sticky)
      container.style.height = `${entranceHeight + travel + window.innerHeight}px`;
    };

    setHeight();
    window.addEventListener("resize", setHeight);

    const update = () => {
      const rect = container.getBoundingClientRect();
      const scrolled = -rect.top;
      const scrollable = container.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = Math.max(0, Math.min(1, scrolled / scrollable));

      // How much of overall progress is the entrance phase?
      const entranceHeight = window.innerHeight * ENTRANCE_SCREENS;
      const entranceRatio = entranceHeight / scrollable;

      if (progress <= entranceRatio) {
        // === Phase 1: Entrance — rise from bottom ===
        const ep = progress / entranceRatio; // 0 → 1 during entrance

        // Ease-out for smooth deceleration
        const eased = 1 - Math.pow(1 - ep, 3);
        const yPct = (1 - eased) * 100; // 100% → 0%

        wrapper.style.transform = `translateY(${yPct}%)`;
        track.style.transform = "translateX(0)";

        // Label fades in during last 40% of entrance
        if (label) {
          const labelP = Math.max(0, (ep - 0.6) / 0.4);
          label.style.opacity = String(labelP);
        }

        // Items start invisible during entrance
        itemRefs.current.forEach((el) => {
          if (el) el.style.opacity = "0";
        });
      } else {
        // === Phase 2: Horizontal parallax ===
        const hp = (progress - entranceRatio) / (1 - entranceRatio); // 0 → 1

        wrapper.style.transform = "translateY(0)";

        const travel = track.scrollWidth - window.innerWidth;
        track.style.transform = `translateX(${-hp * travel}px)`;

        if (label) label.style.opacity = "1";

        // Stagger items based on horizontal progress
        itemRefs.current.forEach((el, i) => {
          if (!el) return;
          const threshold =
            i === 0 ? -0.05 : (i / (experiences.length - 1)) * 0.8;
          const ip = Math.min(1, Math.max(0, (hp - threshold) / 0.1));
          const isAbove = i % 2 === 0;
          el.style.opacity = String(ip);
          el.style.transform = `translateY(${(1 - ip) * (isAbove ? 28 : -28)}px)`;
        });
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", setHeight);
    };
  }, []);

  return (
    <section ref={containerRef} id="cv" className="relative">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Wrapper — handles vertical entrance animation */}
        <div
          ref={wrapperRef}
          className="absolute inset-0 rounded-t-3xl"
          style={{
            willChange: "transform",
            transform: "translateY(100%)",
            backgroundColor: "#0f1d3d",
          }}
        >
          {/* Section label */}
          <div
            ref={labelRef}
            className="absolute top-10 left-10 z-20 pointer-events-none"
            style={{ opacity: 0 }}
          >
            <p className="text-xs tracking-[0.3em] uppercase font-medium" style={{ color: "#64748b" }}>
              Experience
            </p>
          </div>

          {/* Download CV link */}
          <div className="absolute top-10 right-10 z-20">
            <a
              href="/cv.pdf"
              download
              className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase hover:text-lime transition-colors duration-300 font-medium"
              style={{ color: "#64748b" }}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Download CV
            </a>
          </div>

          {/* Horizontal track */}
          <div
            ref={trackRef}
            className="absolute inset-y-0 left-0 flex"
            style={{
              paddingLeft: "10vw",
              paddingRight: "18vw",
              gap: "5vw",
              willChange: "transform",
            }}
          >
            {/* Timeline rule */}
            <div
              className="absolute top-1/2 left-0 h-px pointer-events-none"
              style={{
                width: `${experiences.length * 450 + 400}px`,
                background:
                  "linear-gradient(to right, transparent, rgba(255,255,255,0.08) 5%, rgba(255,255,255,0.08) 95%, transparent)",
              }}
            />

            {experiences.map((exp, i) => {
              const isAbove = i % 2 === 0;
              return (
                <div
                  key={i}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  className="relative flex-shrink-0 h-screen flex flex-col"
                  style={{ width: 340, opacity: 0 }}
                >
                  {/* Top half — card for "above" entries */}
                  <div className="flex-1 flex flex-col justify-end pb-10">
                    {isAbove && <Card exp={exp} />}
                  </div>

                  {/* Dot on the centre line */}
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 z-10">
                    <div
                      className="w-3 h-3 rounded-full bg-lime"
                      style={{
                        boxShadow:
                          "0 0 0 4px rgba(96, 165, 250, 0.25)",
                      }}
                    />
                  </div>

                  {/* Bottom half — card for "below" entries */}
                  <div className="flex-1 flex flex-col justify-start pt-10">
                    {!isAbove && <Card exp={exp} />}
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
