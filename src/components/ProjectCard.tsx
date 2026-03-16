"use client";

import Link from "next/link";
import type { Project } from "@/lib/projects";

export default function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  return (
    <Link href={`/projects/${project.slug}`} className="group block">
      <article
        className="project-card animate-fade-up"
        style={{ animationDelay: `${index * 150}ms` }}
      >
        {/* Image placeholder */}
        <div
          className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6"
          style={{ backgroundColor: project.color }}
        >
          <div className="project-image absolute inset-0 flex items-center justify-center">
            <span className="font-[family-name:var(--font-display)] text-white/90 text-5xl md:text-7xl italic">
              {project.title}
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0">
            <span className="text-white/90 text-sm font-medium tracking-wide">
              View case study
            </span>
            <svg
              className="w-5 h-5 text-white/90"
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
            <h3 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-sand-900 group-hover:text-accent transition-colors duration-300">
              {project.title}
            </h3>
            <p className="mt-1.5 text-sand-500 text-sm md:text-base leading-relaxed">
              {project.tagline}
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-3 mt-1">
            <span className="text-xs tracking-wide uppercase text-sand-400 font-medium">
              {project.category}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
