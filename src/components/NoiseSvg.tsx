"use client";

import { useEffect, useRef } from "react";

/**
 * Hidden SVG that defines an animated feTurbulence noise filter.
 * We animate the baseFrequency seed via rAF for that old-TV-static look.
 * The filter is referenced by id="textNoise" from CSS.
 */
export default function NoiseSvg({ active }: { active: boolean }) {
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(frameRef.current);
      return;
    }

    let seed = 0;
    const animate = () => {
      seed += 1;
      if (turbRef.current) {
        turbRef.current.setAttribute("seed", String(seed));
      }
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [active]);

  return (
    <svg className="absolute w-0 h-0" aria-hidden="true">
      <defs>
        <filter id="textNoise" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            ref={turbRef}
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            seed="0"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
