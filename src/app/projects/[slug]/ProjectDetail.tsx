"use client";

import Link from "next/link";
import type { Project, ProjectSection } from "@/lib/projects";

function SectionRenderer({
  section,
  index,
  color,
}: {
  section: ProjectSection;
  index: number;
  color: string;
}) {
  const num = String(index + 1).padStart(2, "0");

  // Highlight / quote-style block
  if (section.layout === "highlight") {
    return (
      <div className="max-w-5xl mx-auto px-6">
        <div
          className="rounded-3xl p-12 md:p-16 border border-dark-700/50 relative overflow-hidden"
          style={{ backgroundColor: color }}
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white,transparent_70%)]" />
          <div className="relative z-10">
            <span className="text-xs tracking-[0.2em] uppercase text-white/40 font-medium">
              {num}
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-bold text-white mt-3 mb-6 leading-tight">
              {section.title}
            </h2>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl">
              {section.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Stats block
  if (section.layout === "stats" && section.stats) {
    return (
      <div className="max-w-4xl mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-8 mb-10">
          <div className="md:col-span-2">
            <span className="text-xs tracking-[0.2em] uppercase text-lime font-medium">
              {num}
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-slate-100 mt-2">
              {section.title}
            </h2>
          </div>
          <div className="md:col-span-3">
            <p className="text-lg text-slate-300 leading-relaxed">
              {section.content}
            </p>
          </div>
        </div>
        <div
          className={`grid gap-4 ${
            section.stats.length === 4
              ? "grid-cols-2 md:grid-cols-4"
              : "grid-cols-1 md:grid-cols-3"
          }`}
        >
          {section.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-dark-700/50 bg-dark-800/50 p-6 text-center"
            >
              <p className="text-xs tracking-[0.2em] uppercase text-slate-500 font-medium mb-2">
                {stat.label}
              </p>
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-100">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Text + Image side by side
  if (section.layout === "text-image" && section.image) {
    return (
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs tracking-[0.2em] uppercase text-lime font-medium">
              {num}
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-slate-100 mt-2 mb-6">
              {section.title}
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              {section.content}
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-dark-700/50">
            <img
              src={section.image}
              alt={section.title}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    );
  }

  // Image + Text (reversed)
  if (section.layout === "image-text" && section.image) {
    return (
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="rounded-2xl overflow-hidden border border-dark-700/50 md:order-1 order-2">
            <img
              src={section.image}
              alt={section.title}
              className="w-full h-auto"
            />
          </div>
          <div className="md:order-2 order-1">
            <span className="text-xs tracking-[0.2em] uppercase text-lime font-medium">
              {num}
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-slate-100 mt-2 mb-6">
              {section.title}
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              {section.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Full-width image
  if (section.layout === "full-image" && section.image) {
    return (
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-xs tracking-[0.2em] uppercase text-lime font-medium">
            {num}
          </span>
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-slate-100 mt-2">
            {section.title}
          </h2>
        </div>
        <div className="rounded-3xl overflow-hidden border border-dark-700/50">
          <img
            src={section.image}
            alt={section.title}
            className="w-full h-auto"
          />
        </div>
        {section.content && (
          <p className="text-lg text-slate-300 leading-relaxed mt-8 max-w-4xl">
            {section.content}
          </p>
        )}
      </div>
    );
  }

  // Default text layout
  return (
    <div className="max-w-4xl mx-auto px-6">
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-2">
          <span className="text-xs tracking-[0.2em] uppercase text-lime font-medium">
            {num}
          </span>
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-slate-100 mt-2">
            {section.title}
          </h2>
        </div>
        <div className="md:col-span-3">
          <p className="text-lg text-slate-300 leading-relaxed">
            {section.content}
          </p>
          {section.image && (
            <div className="mt-8 rounded-2xl overflow-hidden border border-dark-700/50">
              <img
                src={section.image}
                alt={section.title}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetail({
  project,
  nextProject,
}: {
  project: Project;
  nextProject: Project;
}) {
  const hasSections = project.sections && project.sections.length > 0;

  return (
    <>
      {/* Back nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-dark-950/80 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-lime transition-colors"
          >
            <svg
              className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16l-4-4m0 0l4-4m-4 4h18"
              />
            </svg>
            Back to all work
          </Link>
          <span className="text-xs tracking-widest uppercase text-slate-500">
            {project.category}
          </span>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero */}
        <section
          className="relative h-[60vh] md:h-[75vh] flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: project.color }}
        >
          {project.heroImage && (
            <img
              src={project.heroImage}
              alt={project.title}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}
          <div className="relative z-10 text-center text-white px-6 animate-fade-up">
            <p className="text-sm tracking-[0.3em] uppercase text-white/50 mb-4 font-medium">
              {project.year}
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-6xl md:text-8xl lg:text-9xl font-bold mb-4">
              {project.title}
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto">
              {project.tagline}
            </p>
          </div>
        </section>

        {/* Meta bar */}
        <section className="py-24 md:py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12 mb-20 animate-fade-up delay-100">
              <div className="border-t border-dark-700 pt-4">
                <h3 className="text-xs tracking-[0.2em] uppercase text-slate-500 font-medium mb-2">
                  Role
                </h3>
                <p className="text-slate-200">{project.category}</p>
              </div>
              <div className="border-t border-dark-700 pt-4">
                <h3 className="text-xs tracking-[0.2em] uppercase text-slate-500 font-medium mb-2">
                  Year
                </h3>
                <p className="text-slate-200">{project.year}</p>
              </div>
              <div className="border-t border-dark-700 pt-4">
                <h3 className="text-xs tracking-[0.2em] uppercase text-slate-500 font-medium mb-2">
                  Tools
                </h3>
                <p className="text-slate-200">{project.tools.join(", ")}</p>
              </div>
            </div>

            <div className="animate-fade-up delay-200">
              <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-slate-100 mb-6">
                Overview
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed">
                {project.overview}
              </p>
            </div>
          </div>
        </section>

        {/* Custom sections (if project has them) */}
        {hasSections ? (
          <div className="space-y-24 pb-24">
            {project.sections!.map((section, i) => (
              <SectionRenderer
                key={i}
                section={section}
                index={i}
                color={project.color}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Fallback: original layout for projects without sections */}
            <section className="px-6 mb-24">
              <div
                className="max-w-6xl mx-auto h-[40vh] md:h-[50vh] rounded-3xl flex items-center justify-center border border-dark-700/50"
                style={{
                  backgroundColor: project.color,
                  opacity: 0.8,
                }}
              >
                <span className="font-[family-name:var(--font-display)] text-white/30 text-4xl font-bold">
                  Project imagery
                </span>
              </div>
            </section>

            <section className="py-16 px-6">
              <div className="max-w-4xl mx-auto space-y-24">
                {[
                  { title: "The Challenge", content: project.challenge },
                  { title: "The Approach", content: project.approach },
                  { title: "The Outcome", content: project.outcome },
                ].map((block, i) => (
                  <div key={block.title} className="grid md:grid-cols-5 gap-8">
                    <div className="md:col-span-2">
                      <span className="text-xs tracking-[0.2em] uppercase text-lime font-medium">
                        0{i + 1}
                      </span>
                      <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-slate-100 mt-2">
                        {block.title}
                      </h2>
                    </div>
                    <div className="md:col-span-3">
                      <p className="text-lg text-slate-300 leading-relaxed">
                        {block.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="px-6 py-16">
              <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="aspect-[4/3] rounded-2xl flex items-center justify-center border border-dark-700/50"
                    style={{ backgroundColor: project.color, opacity: 0.6 }}
                  >
                    <span className="font-[family-name:var(--font-display)] text-white/30 text-2xl font-bold">
                      Detail {n}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Next project */}
        <section className="py-32 px-6 bg-dark-800/50 border-t border-dark-700/50">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm tracking-[0.3em] uppercase text-slate-500 font-medium mb-4">
              Next project
            </p>
            <Link
              href={`/projects/${nextProject.slug}`}
              className="group"
            >
              <h2 className="font-[family-name:var(--font-display)] text-5xl md:text-7xl font-bold text-slate-100 group-hover:text-lime transition-colors duration-300">
                {nextProject.title}
              </h2>
              <p className="mt-4 text-slate-400 text-lg">
                {nextProject.tagline}
              </p>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-dark-950 border-t border-dark-800 text-slate-500 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm">
            &copy; {new Date().getFullYear()} Robert Kolek
          </span>
          <Link href="/" className="text-sm text-slate-600 hover:text-lime transition-colors">
            Back home
          </Link>
        </div>
      </footer>
    </>
  );
}
