"use client";

import Navigation from "@/components/Navigation";
import ParallaxWork from "@/components/ParallaxWork";
import CVTimeline from "@/components/CVTimeline";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <ParallaxWork />
        <CVTimeline />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
