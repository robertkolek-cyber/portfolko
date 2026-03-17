"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { projects, type Project } from "@/lib/projects";

/* ── Per-tile timing ────────────────────────────────────────── */

function useTileTiming(index: number, total: number) {
  const step = 0.75 / total;
  const center = 0.15 + index * step;
  const start = center - step * 1.15;
  const end = center + step * 0.85;
  return { start, center, end };
}

/* ── Single project tile ────────────────────────────────────── */

function ProjectTile({
  project,
  index,
  total,
  scrollYProgress,
}: {
  project: Project;
  index: number;
  total: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const { start, center, end } = useTileTiming(index, total);
  const isEven = index % 2 === 0;

  // Scale: small → full → massive fly-past
  const scale = useTransform(scrollYProgress, [start, center, end], [0.3, 1, 3.5]);

  // Opacity: fade in, hold, fade out
  const opacity = useTransform(
    scrollYProgress,
    [start, start + (center - start) * 0.3, center, end - (end - center) * 0.2, end],
    [0, 1, 1, 1, 0]
  );

  // Horizontal drift: stagger even/odd
  const x = useTransform(
    scrollYProgress,
    [start, center, end],
    isEven ? ["-5vw", "-32vw", "-100vw"] : ["5vw", "32vw", "100vw"]
  );

  // Z-index derived from scale (closer = higher)
  const zIndex = useTransform(scale, (s) => Math.round(s * 100));

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity, zIndex }}
    >
      <motion.div style={{ scale, x }} className="pointer-events-auto">
        <Link href={`/projects/${project.slug}`} className="group block">
          <article className="w-[80vw] max-w-3xl">
            {/* Image area */}
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

            {/* Info */}
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
      </motion.div>
    </motion.div>
  );
}

/* ── Section heading that fades out ─────────────────────────── */

function SectionHeading({
  scrollYProgress,
}: {
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const opacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.05], [1, 1.1]);
  const y = useTransform(scrollYProgress, [0, 0.05], ["0vh", "-5vh"]);
  const filter = useTransform(scrollYProgress, [0, 0.05], ["blur(0px)", "blur(10px)"]);
  const display = useTransform(scrollYProgress, (v) => (v > 0.08 ? "none" : "block"));

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      style={{ opacity, scale, y, filter, display }}
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
    </motion.div>
  );
}

/* ── Main parallax section ──────────────────────────────────── */

export default function ParallaxWork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const total = projects.length;

  return (
    <section id="work" ref={containerRef} className="relative h-[800vh]">
      {/* Sticky viewport — everything stays visible here */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Heading — fades out immediately */}
        <SectionHeading scrollYProgress={scrollYProgress} />

        {/* Project tiles — fly through one by one */}
        {projects.map((project, i) => (
          <ProjectTile
            key={project.slug}
            project={project}
            index={i}
            total={total}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </div>
    </section>
  );
}
