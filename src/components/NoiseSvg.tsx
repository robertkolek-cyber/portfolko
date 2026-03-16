"use client";

import { useEffect, useRef } from "react";

/**
 * Hidden SVG with an aggressive animated noise displacement filter.
 * Seed changes every frame → the text gets destroyed by static.
 */
export default function NoiseSvg({ active }: { active: boolean }) {
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(frameRef.current);
      // When deactivating, slam scale to 0 so filter disappears
      if (dispRef.current) {
        dispRef.current.setAttribute("scale", "0");
      }
      return;
    }

    let seed = 0;
    let time = 0;

    const animate = () => {
      seed += 3; // jump seed faster → more chaotic
      time += 0.016;
      if (turbRef.current) {
        turbRef.current.setAttribute("seed", String(seed));
        // Oscillate frequency slightly for more organic crunch
        const freq = 0.65 + Math.sin(time * 4) * 0.15;
        turbRef.current.setAttribute("baseFrequency", String(freq));
      }
      if (dispRef.current) {
        // Pulsate displacement scale for breathing distortion
        const scale = 18 + Math.sin(time * 6) * 6;
        dispRef.current.setAttribute("scale", String(scale));
      }
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [active]);

  return (
    <svg className="absolute w-0 h-0" aria-hidden="true">
      <defs>
        <filter id="textNoise" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            ref={turbRef}
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="4"
            seed="0"
            result="noise"
          />
          <feDisplacementMap
            ref={dispRef}
            in="SourceGraphic"
            in2="noise"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
