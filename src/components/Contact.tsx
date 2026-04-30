"use client";

import { useRef } from "react";
import { useInView } from "@/lib/useInView";

const SOCIALS = [
  { label: "LinkedIn",  href: "#" },
  { label: "Dribbble",  href: "#" },
  { label: "Behance",   href: "#" },
  { label: "Instagram", href: "#" },
];

export default function Contact() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, 0.2);

  return (
    <section
      id="contact"
      ref={ref}
      className="py-32 md:py-40 px-6 relative overflow-hidden border-t border-dark-700/50"
    >
      {/* Ambient lime glow behind CTA */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full bg-lime/[0.06] blur-[160px] pointer-events-none" />

      <div
        className={`max-w-4xl mx-auto text-center relative transition-all duration-1000 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <p className="text-xs tracking-[0.3em] uppercase text-slate-500 font-medium mb-8 inline-flex items-center justify-center gap-3">
          <span className="w-6 h-px bg-lime/40" />
          Get in touch
          <span className="w-6 h-px bg-lime/40" />
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl lg:text-7xl leading-[1.05] font-bold text-slate-100 mb-8">
          Let&apos;s create something
          <br />
          <span className="text-lime italic">remarkable</span> together.
        </h2>
        <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-12">
          I&apos;m always open to new projects, collaborations, or just a good
          conversation about design. Drop me a line.
        </p>

        <a
          href="mailto:hello@robertkolek.com"
          className="group inline-flex items-center gap-3 bg-lime text-dark-950 px-10 py-5 rounded-full text-base font-semibold tracking-wide hover:bg-lime-light transition-all duration-300 glow-lime"
        >
          hello@robertkolek.com
          <svg
            className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </a>

        <div className="mt-16 flex items-center justify-center gap-6 sm:gap-8 flex-wrap">
          {SOCIALS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="link-underline text-sm text-slate-500 hover:text-lime transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
