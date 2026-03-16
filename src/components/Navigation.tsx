"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled
          ? "bg-dark-950/80 backdrop-blur-xl border-b border-dark-700/50"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-slate-100"
          >
            RK<span className="text-lime">.</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#work" className="link-underline text-sm tracking-wide uppercase font-medium text-slate-400 hover:text-lime transition-colors">
              Work
            </a>
            <a href="#about" className="link-underline text-sm tracking-wide uppercase font-medium text-slate-400 hover:text-lime transition-colors">
              About
            </a>
            <a href="#contact" className="link-underline text-sm tracking-wide uppercase font-medium text-slate-400 hover:text-lime transition-colors">
              Contact
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span
              className={`block h-0.5 w-6 bg-slate-100 transition-all duration-300 ${
                menuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-slate-100 transition-all duration-300 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-slate-100 transition-all duration-300 ${
                menuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-smooth ${
          menuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-8 pt-2 bg-dark-950/95 backdrop-blur-xl space-y-6">
          <a
            href="#work"
            onClick={() => setMenuOpen(false)}
            className="block text-lg font-medium text-slate-200 hover:text-lime transition-colors"
          >
            Work
          </a>
          <a
            href="#about"
            onClick={() => setMenuOpen(false)}
            className="block text-lg font-medium text-slate-200 hover:text-lime transition-colors"
          >
            About
          </a>
          <a
            href="#contact"
            onClick={() => setMenuOpen(false)}
            className="block text-lg font-medium text-slate-200 hover:text-lime transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </nav>
  );
}
