"use client";

import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import ParallaxWork from "@/components/ParallaxWork";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <ParallaxWork />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
