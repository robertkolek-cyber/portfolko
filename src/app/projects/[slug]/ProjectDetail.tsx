"use client";

import Link from "next/link";
import type { Project, ProjectSection } from "@/lib/projects";

/* ── Fake phone mockup ── */
function PhoneMockup({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: string;
}) {
  return (
    <div className="flex-shrink-0 w-[200px] md:w-[220px]">
      <div className="rounded-[28px] bg-[#111] border border-white/10 p-3 shadow-2xl">
        {/* Notch */}
        <div className="mx-auto w-20 h-5 bg-black rounded-b-xl mb-3" />
        {/* Screen */}
        <div className="rounded-[20px] bg-[#1a1a2e] p-4 min-h-[300px]">
          <div
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: accent }}
          >
            {title}
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item}
                className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5"
              >
                <span className="text-white/70 text-xs">{item}</span>
              </div>
            ))}
          </div>
          {/* Fake chart / visual element */}
          <div className="mt-4 flex items-end gap-1 h-12">
            {[40, 65, 50, 80, 60, 75, 90].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: `${h}%`,
                  backgroundColor: accent,
                  opacity: 0.3 + i * 0.1,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Section renderer ── */
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
  const accent = "#4ade80"; // green accent like Škoda

  // Dark full-width block
  if (section.layout === "dark-block") {
    return (
      <div className="w-full" style={{ backgroundColor: color }}>
        <div className="max-w-4xl mx-auto px-6 py-20 md:py-28">
          <span className="text-xs tracking-[0.2em] uppercase font-medium" style={{ color: accent }}>
            {num}
          </span>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-bold text-white mt-3 mb-6 leading-tight">
            {section.title}
          </h2>
          <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl">
            {section.content}
          </p>
        </div>
      </div>
    );
  }

  // Two-column items
  if (section.layout === "two-column" && section.items) {
    return (
      <div className="max-w-4xl mx-auto px-6">
        <span className="text-xs tracking-[0.2em] uppercase text-lime font-medium">{num}</span>
        <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-slate-100 mt-2 mb-8">
          {section.title}
        </h2>
        {section.content && (
          <p className="text-lg text-slate-300 leading-relaxed mb-8">{section.content}</p>
        )}
        <div className={`grid gap-6 ${section.items.length > 2 ? "md:grid-cols-2" : "md:grid-cols-2"}`}>
          {section.items.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-dark-700/50 bg-dark-800/60 p-6 relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 w-1 h-full rounded-r"
                style={{ backgroundColor: accent }}
              />
              <p className="text-slate-300 leading-relaxed pl-4">{item}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // HMW (How Might We) — centered, large, italic
  if (section.layout === "hmw") {
    return (
      <div className="w-full py-20 md:py-28" style={{ backgroundColor: color }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <span className="text-xs tracking-[0.2em] uppercase font-medium" style={{ color: accent }}>
            {num} &mdash; {section.title}
          </span>
          <p className="font-[family-name:var(--font-display)] text-2xl md:text-4xl text-white font-bold mt-6 leading-snug italic">
            &ldquo;{section.content}&rdquo;
          </p>
        </div>
      </div>
    );
  }

  // Highlight block
  if (section.layout === "highlight") {
    return (
      <div className="max-w-5xl mx-auto px-6">
        <div
          className="rounded-3xl p-12 md:p-16 border border-white/5 relative overflow-hidden"
          style={{ backgroundColor: color }}
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_80%,#4ade80,transparent_60%)]" />
          <div className="relative z-10">
            <span className="text-xs tracking-[0.2em] uppercase font-medium" style={{ color: accent }}>
              {num}
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-white mt-3 mb-6 leading-tight">
              {section.title}
            </h2>
            <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl">
              {section.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Phone mockups
  if (section.layout === "phones" && section.phoneScreens) {
    return (
      <div className="w-full" style={{ backgroundColor: color }}>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <span className="text-xs tracking-[0.2em] uppercase font-medium" style={{ color: accent }}>
            {num}
          </span>
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-white mt-2 mb-4">
            {section.title}
          </h2>
          <p className="text-lg text-white/50 leading-relaxed max-w-2xl mb-12">
            {section.content}
          </p>
          <div className="flex gap-6 overflow-x-auto pb-4 justify-center flex-wrap md:flex-nowrap">
            {section.phoneScreens.map((screen) => (
              <PhoneMockup
                key={screen.title}
                title={screen.title}
                items={screen.items}
                accent={accent}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Stats
  if (section.layout === "stats" && section.stats) {
    return (
      <div className="max-w-4xl mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-8 mb-10">
          <div className="md:col-span-2">
            <span className="text-xs tracking-[0.2em] uppercase text-lime font-medium">{num}</span>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-slate-100 mt-2">
              {section.title}
            </h2>
          </div>
          <div className="md:col-span-3">
            <p className="text-lg text-slate-300 leading-relaxed">{section.content}</p>
          </div>
        </div>
        <div
          className={`grid gap-4 ${
            section.stats.length === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-3"
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

  // Text + Image
  if (section.layout === "text-image" && section.image) {
    return (
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs tracking-[0.2em] uppercase text-lime font-medium">{num}</span>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-slate-100 mt-2 mb-6">
              {section.title}
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">{section.content}</p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-dark-700/50">
            <img src={section.image} alt={section.title} className="w-full h-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Image + Text
  if (section.layout === "image-text" && section.image) {
    return (
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="rounded-2xl overflow-hidden border border-dark-700/50">
            <img src={section.image} alt={section.title} className="w-full h-auto" />
          </div>
          <div>
            <span className="text-xs tracking-[0.2em] uppercase text-lime font-medium">{num}</span>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-slate-100 mt-2 mb-6">
              {section.title}
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">{section.content}</p>
          </div>
        </div>
      </div>
    );
  }

  // Full image
  if (section.layout === "full-image" && section.image) {
    return (
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-xs tracking-[0.2em] uppercase text-lime font-medium">{num}</span>
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-slate-100 mt-2">
            {section.title}
          </h2>
        </div>
        <div className="rounded-3xl overflow-hidden border border-dark-700/50">
          <img src={section.image} alt={section.title} className="w-full h-auto" />
        </div>
        {section.content && (
          <p className="text-lg text-slate-300 leading-relaxed mt-8 max-w-4xl">{section.content}</p>
        )}
      </div>
    );
  }

  // Default text
  return (
    <div className="max-w-4xl mx-auto px-6">
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-2">
          <span className="text-xs tracking-[0.2em] uppercase text-lime font-medium">{num}</span>
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-slate-100 mt-2">
            {section.title}
          </h2>
        </div>
        <div className="md:col-span-3">
          <p className="text-lg text-slate-300 leading-relaxed">{section.content}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
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
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent" />
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

        {/* Sections */}
        {hasSections ? (
          <div className="space-y-0">
            {project.sections!.map((section, i) => {
              const isFullWidth =
                section.layout === "dark-block" ||
                section.layout === "phones" ||
                section.layout === "hmw";
              return (
                <div
                  key={i}
                  className={isFullWidth ? "" : "py-12 md:py-16"}
                >
                  <SectionRenderer section={section} index={i} color={project.color} />
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <section className="px-6 mb-24">
              <div
                className="max-w-6xl mx-auto h-[40vh] md:h-[50vh] rounded-3xl flex items-center justify-center border border-dark-700/50"
                style={{ backgroundColor: project.color, opacity: 0.8 }}
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
                      <p className="text-lg text-slate-300 leading-relaxed">{block.content}</p>
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
            <Link href={`/projects/${nextProject.slug}`} className="group">
              <h2 className="font-[family-name:var(--font-display)] text-5xl md:text-7xl font-bold text-slate-100 group-hover:text-lime transition-colors duration-300">
                {nextProject.title}
              </h2>
              <p className="mt-4 text-slate-400 text-lg">{nextProject.tagline}</p>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-dark-950 border-t border-dark-800 text-slate-500 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm">&copy; {new Date().getFullYear()} Robert Kolek</span>
          <Link href="/" className="text-sm text-slate-600 hover:text-lime transition-colors">
            Back home
          </Link>
        </div>
      </footer>
    </>
  );
}
