"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Project } from "@/lib/projects";

export default function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = parallaxRef.current;
    if (!el) return;

    el.style.willChange = "transform";
    el.style.transformStyle = "preserve-3d";

    const update = () => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const cardCenter = rect.top + rect.height / 2;
      // 0 when card center is at viewport bottom, 1 at viewport top
      const progress = 1 - cardCenter / viewH;
      const clamped = Math.max(0, Math.min(1, progress));

      // Cards start far away (negative Z) and fly toward the viewer as they scroll up
      // perspective() must be inline — parent perspective doesn't propagate through <a> tags
      const z = -300 + clamped * 350;    // -300px → +50px toward viewer
      const rotX = (1 - clamped) * 8;    // tilt that flattens as card approaches
      const scale = 0.85 + clamped * 0.15;

      el.style.transform = `perspective(1000px) translateZ(${z}px) rotateX(${rotX}deg) scale(${scale})`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [index]);

  return (
    <Link href={`/projects/${project.slug}`} className="group block">
      {/* parallax wrapper */}
      <div ref={parallaxRef}>
        <article
          className="project-card animate-fade-up"
          style={{ animationDelay: `${index * 150}ms` }}
        >
          {/* Image placeholder */}
          <div
            className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6 border border-dark-700/50"
            style={{ backgroundColor: project.color }}
          >
            <div className="project-image absolute inset-0 flex items-center justify-center">
              <span className="font-[family-name:var(--font-display)] text-white/80 text-5xl md:text-7xl font-bold">
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
            <div className="flex-shrink-0 mt-1">
              <span className="text-xs tracking-wide uppercase text-slate-500 font-medium">
                {project.category}
              </span>
            </div>
          </div>
        </article>
      </div>
    </Link>
  );
}
