"use client";

import Link from "next/link";
import type { Project } from "@/lib/projects";

export default function ProjectDetail({
  project,
  nextProject,
}: {
  project: Project;
  nextProject: Project;
}) {
  return (
    <>
      {/* Back nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-sand-50/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-sand-600 hover:text-sand-900 transition-colors"
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
          <span className="text-xs tracking-widest uppercase text-sand-400">
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
          <div className="relative z-10 text-center text-white px-6 animate-fade-up">
            <p className="text-sm tracking-[0.3em] uppercase text-white/60 mb-4">
              {project.year}
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-6xl md:text-8xl lg:text-9xl italic mb-4">
              {project.title}
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto">
              {project.tagline}
            </p>
          </div>
        </section>

        {/* Overview */}
        <section className="py-24 md:py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12 mb-20 animate-fade-up delay-100">
              <div>
                <h3 className="text-xs tracking-[0.2em] uppercase text-sand-400 font-medium mb-2">
                  Role
                </h3>
                <p className="text-sand-700">{project.category}</p>
              </div>
              <div>
                <h3 className="text-xs tracking-[0.2em] uppercase text-sand-400 font-medium mb-2">
                  Year
                </h3>
                <p className="text-sand-700">{project.year}</p>
              </div>
              <div>
                <h3 className="text-xs tracking-[0.2em] uppercase text-sand-400 font-medium mb-2">
                  Tools
                </h3>
                <p className="text-sand-700">{project.tools.join(", ")}</p>
              </div>
            </div>

            <div className="animate-fade-up delay-200">
              <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-sand-900 mb-6">
                Overview
              </h2>
              <p className="text-lg text-sand-600 leading-relaxed">
                {project.overview}
              </p>
            </div>
          </div>
        </section>

        {/* Image placeholder */}
        <section className="px-6 mb-24">
          <div
            className="max-w-6xl mx-auto h-[40vh] md:h-[50vh] rounded-3xl flex items-center justify-center"
            style={{
              backgroundColor: project.color,
              opacity: 0.8,
            }}
          >
            <span className="font-[family-name:var(--font-display)] text-white/40 text-4xl italic">
              Project imagery
            </span>
          </div>
        </section>

        {/* Challenge / Approach / Outcome */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto space-y-24">
            {[
              { title: "The Challenge", content: project.challenge },
              { title: "The Approach", content: project.approach },
              { title: "The Outcome", content: project.outcome },
            ].map((block, i) => (
              <div key={block.title} className="grid md:grid-cols-5 gap-8">
                <div className="md:col-span-2">
                  <span className="text-xs tracking-[0.2em] uppercase text-sand-400 font-medium">
                    0{i + 1}
                  </span>
                  <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-sand-900 mt-2">
                    {block.title}
                  </h2>
                </div>
                <div className="md:col-span-3">
                  <p className="text-lg text-sand-600 leading-relaxed">
                    {block.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* More image placeholders */}
        <section className="px-6 py-16">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="aspect-[4/3] rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: project.color, opacity: 0.6 }}
              >
                <span className="font-[family-name:var(--font-display)] text-white/40 text-2xl italic">
                  Detail {n}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Next project */}
        <section className="py-32 px-6 bg-sand-100">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm tracking-[0.3em] uppercase text-sand-400 font-medium mb-4">
              Next project
            </p>
            <Link
              href={`/projects/${nextProject.slug}`}
              className="group"
            >
              <h2 className="font-[family-name:var(--font-display)] text-5xl md:text-7xl text-sand-900 group-hover:text-accent transition-colors duration-300 italic">
                {nextProject.title}
              </h2>
              <p className="mt-4 text-sand-500 text-lg">
                {nextProject.tagline}
              </p>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-sand-950 text-sand-500 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm">
            &copy; {new Date().getFullYear()} Robert Kolek
          </span>
          <Link href="/" className="text-sm text-sand-600 hover:text-sand-400 transition-colors">
            Back home
          </Link>
        </div>
      </footer>
    </>
  );
}
