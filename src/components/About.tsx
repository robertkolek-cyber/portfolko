"use client";

import { useRef } from "react";
import { useInView } from "@/lib/useInView";

const skills = [
  {
    label: "Product Design",
    items: ["User Research", "Interaction Design", "Prototyping", "Design Systems"],
  },
  {
    label: "Brand & Identity",
    items: ["Visual Identity", "Art Direction", "Typography", "Guidelines"],
  },
  {
    label: "Creative Tech",
    items: ["Motion Design", "Generative Art", "Creative Coding", "3D"],
  },
  {
    label: "Strategy",
    items: ["Design Thinking", "Workshop Facilitation", "User Testing", "Analytics"],
  },
];

export default function About() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, 0.2);

  return (
    <section
      id="about"
      ref={ref}
      className="py-32 md:py-40 px-6 relative overflow-hidden"
    >
      {/* Ambient lime wash */}
      <div className="absolute -top-32 right-0 w-[600px] h-[600px] rounded-full bg-lime/[0.04] blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div
          className={`grid md:grid-cols-2 gap-16 md:gap-24 items-start transition-all duration-1000 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-slate-500 font-medium mb-6 inline-flex items-center gap-3">
              <span className="w-6 h-px bg-lime/50" />
              About
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl lg:text-6xl leading-[1.05] font-bold text-slate-100">
              Design is how
              <br />
              I <span className="text-lime italic">think</span>.
            </h2>
          </div>

          <div className="space-y-6 text-slate-400 leading-relaxed text-lg">
            <p>
              I&apos;m a multidisciplinary designer with 8+ years of experience
              crafting digital products, design systems, and user experiences.
              I believe the best design emerges at the intersection of empathy,
              strategy, and craft.
            </p>
            <p>
              Currently based in Prague, I work with startups and established
              brands to transform complex challenges into elegant, intuitive
              solutions. My process is deeply collaborative — every great
              product is born from honest conversations and shared vision.
            </p>
            <p>
              When I&apos;m not designing, you&apos;ll find me exploring
              typography, experimenting with generative art, or hunting for the
              perfect espresso.
            </p>
          </div>
        </div>

        {/* Skills / expertise */}
        <div
          className={`mt-24 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 transition-all duration-1000 delay-300 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {skills.map((skill) => (
            <div
              key={skill.label}
              className="border-t border-dark-700 pt-6 group"
            >
              <h3 className="font-medium text-lime text-xs tracking-[0.18em] uppercase mb-5 transition-colors duration-300 group-hover:text-lime-light">
                {skill.label}
              </h3>
              <ul className="space-y-2.5">
                {skill.items.map((item) => (
                  <li
                    key={item}
                    className="text-slate-500 text-sm hover:text-slate-300 transition-colors duration-200"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
