"use client";

import { useRef } from "react";
import { useInView } from "@/lib/useInView";

export default function Contact() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, 0.2);

  return (
    <section
      id="contact"
      ref={ref}
      className="py-32 md:py-40 px-6 bg-sand-900 text-sand-100"
    >
      <div
        className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <p className="text-sm tracking-[0.3em] uppercase text-sand-500 font-medium mb-6">
          Get in touch
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl lg:text-7xl leading-[1.1] mb-8">
          Let&apos;s create something
          <br />
          <span className="italic text-accent-light">remarkable</span> together.
        </h2>
        <p className="text-sand-400 text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-12">
          I&apos;m always open to new projects, collaborations, or just a good
          conversation about design. Drop me a line.
        </p>

        <a
          href="mailto:hello@robertkolek.com"
          className="group inline-flex items-center gap-3 bg-sand-100 text-sand-900 px-10 py-5 rounded-full text-base font-medium tracking-wide hover:bg-white transition-colors duration-300"
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

        <div className="mt-16 flex items-center justify-center gap-8">
          {[
            { label: "LinkedIn", href: "#" },
            { label: "Dribbble", href: "#" },
            { label: "Behance", href: "#" },
            { label: "Instagram", href: "#" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="link-underline text-sm text-sand-400 hover:text-sand-200 transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
