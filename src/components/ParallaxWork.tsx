"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { projects } from "@/lib/projects";
import type { Project } from "@/lib/projects";

/* ── Tile timing — each tile gets a scroll window ──────────── */

function getTileTiming(index: number, total: number) {
  const step = 0.75 / total;
  const center = 0.15 + index * step;
  const start = center - step * 1.15;
  const end = center + step * 0.85;
  return { start, center, end };
}

/* ── Single fly-through tile ───────────────────────────────── */

function ProjectTile({
  project,
  index,
  total,
  scrollYProgress,
}: {
  project: Project;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const { start, center, end } = getTileTiming(index, total);
  const isEven = index % 2 === 0;

  // All hooks at the top level — never inside JSX
  const scale = useTransform(scrollYProgress, [start, center, end], [0.3, 1, 3.5]);

  const opacity = useTransform(
    scrollYProgress,
    [start, start + (center - start) * 0.3, center, end - (end - center) * 0.2, end],
    [0, 1, 1, 1, 0]
  );

  const xPercent = useTransform(
    scrollYProgress,
    [start, center, end],
    isEven ? [-5, -35, -120] : [5, 35, 120]
  );
  // Convert numeric vw value to string — hook called at top level
  const x = useTransform(xPercent, (v) => `${v}vw`);

  const zIndex = useTransform(scale, (s) => Math.round(s * 100));

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        opacity,
        zIndex,
        pointerEvents: "none",
      }}
    >
      <motion.div
        style={{ scale, x }}
      >
        <Link
          href={`/projects/${project.slug}`}
          className="group block"
          style={{ pointerEvents: "auto" }}
        >
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
      </motion.div>
    </motion.div>
  );
}

/* ── Heading — fades out on scroll ─────────────────────────── */

function SectionHeading({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  // All hooks at top level
  const opacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);
  const headingScale = useTransform(scrollYProgress, [0, 0.05], [1, 1.1]);
  const y = useTransform(scrollYProgress, [0, 0.05], [0, -60]);
  const blurVal = useTransform(scrollYProgress, [0, 0.05], [0, 10]);
  const filter = useTransform(blurVal, (b) => `blur(${b}px)`);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      style={{ opacity, scale: headingScale, y, filter }}
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

/* ── Main parallax container ───────────────────────────────── */

export default function ParallaxWork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const total = projects.length;

  return (
    <section id="work" ref={containerRef} className="relative h-[800vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <SectionHeading scrollYProgress={scrollYProgress} />
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
