"use client";

import { useRef } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import ProjectCard from "@/components/ProjectCard";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { useInView } from "@/lib/useInView";
import { projects } from "@/lib/projects";

function WorkSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, 0.1);

  return (
    <section id="work" ref={ref} className="py-32 md:py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <div
          className={`mb-16 md:mb-24 transition-all duration-1000 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-sm tracking-[0.3em] uppercase text-slate-500 font-medium mb-4">
            Selected Work
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl lg:text-6xl leading-[1.1] font-bold text-slate-100">
            Projects that
            <br />
            <span className="italic text-lime">define</span> my craft.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12" style={{ perspective: "1200px" }}>
          {projects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <WorkSection />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
