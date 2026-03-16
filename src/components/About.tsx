"use client";

import { useRef } from "react";
import { useInView } from "@/lib/useInView";

export default function About() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, 0.2);

  return (
    <section
      id="about"
      ref={ref}
      className="py-32 md:py-40 px-6"
    >
      <div className="max-w-7xl mx-auto">
        <div
          className={`grid md:grid-cols-2 gap-16 md:gap-24 items-start transition-all duration-1000 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div>
            <p className="text-sm tracking-[0.3em] uppercase text-slate-500 font-medium mb-4">
              About
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl lg:text-6xl leading-[1.1] font-bold text-slate-100">
              Design is how
              <br />
              I <span className="text-lime italic">think</span>.
            </h2>
          </div>

          <div className="space-y-6 text-slate-300 leading-relaxed text-lg">
            <p>
              I&apos;m a multidisciplinary designer with 8+ years of experience
              crafting digital products, design systems, and user experiences.
              I believe the best design emerges at the intersection
              of empathy, strategy, and craft.
            </p>
            <p>
              Currently based in Prague, I work with startups and established
              brands to transform complex challenges into elegant, intuitive
              solutions. My process is deeply collaborative — I believe every
              great product is born from honest conversations and shared vision.
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
          className={`mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-1000 delay-300 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {[
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
          ].map((skill) => (
            <div key={skill.label} className="border-t border-dark-700 pt-6">
              <h3 className="font-medium text-lime text-sm tracking-wide uppercase mb-4">
                {skill.label}
              </h3>
              <ul className="space-y-2">
                {skill.items.map((item) => (
                  <li key={item} className="text-slate-400 text-sm">
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
