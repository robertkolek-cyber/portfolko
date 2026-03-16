"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  ScrambleText — characters resolve one by one, right to left,      */
/*  with each unresolved char cycling through glyphs at varying speed. */
/*  Once resolved, char does a brief y-overshoot settle.              */
/* ------------------------------------------------------------------ */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890@#$%&";

interface CharState {
  resolved: boolean;
  display: string;
  offsetY: number;
  opacity: number;
  targetY: number;
  velocity: number;
}

export function ScrambleText({
  text,
  delay = 0,
  className,
  trigger = true,
}: {
  text: string;
  delay?: number;
  className?: string;
  trigger?: boolean;
}) {
  const [chars, setChars] = useState<CharState[]>(() =>
    text.split("").map(() => ({
      resolved: false,
      display: " ",
      offsetY: 0,
      opacity: 0,
      targetY: 0,
      velocity: 0,
    }))
  );
  const frameRef = useRef(0);
  const startRef = useRef(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!trigger || hasRun.current) return;
    hasRun.current = true;

    const timeout = setTimeout(() => {
      startRef.current = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startRef.current;
        const totalDuration = 1800;
        // Each char has its own resolve time, staggered from first to last
        const staggerPerChar = totalDuration / text.length;
        // Scramble starts 200ms before each char's resolve
        const scrambleWindow = 400;

        setChars(
          text.split("").map((char, i) => {
            if (char === " ") {
              return { resolved: true, display: " ", offsetY: 0, opacity: 1, targetY: 0, velocity: 0 };
            }

            const resolveAt = i * staggerPerChar + 200;
            const scrambleStart = resolveAt - scrambleWindow;

            if (elapsed < scrambleStart) {
              // Not started yet
              return { resolved: false, display: " ", offsetY: 8, opacity: 0, targetY: 0, velocity: 0 };
            }

            if (elapsed >= resolveAt) {
              // Resolved — settle spring
              const settleTime = (elapsed - resolveAt) / 1000;
              const spring = -6 * Math.exp(-settleTime * 8) * Math.sin(settleTime * 25);
              return {
                resolved: true,
                display: char,
                offsetY: spring,
                opacity: 1,
                targetY: 0,
                velocity: 0,
              };
            }

            // Scrambling — cycle through random glyphs
            const scrProgress = (elapsed - scrambleStart) / scrambleWindow;
            const glyphIndex = Math.floor(now * 0.02 + i * 7) % GLYPHS.length;
            return {
              resolved: false,
              display: GLYPHS[glyphIndex],
              offsetY: (1 - scrProgress) * 6,
              opacity: 0.3 + scrProgress * 0.7,
              targetY: 0,
              velocity: 0,
            };
          })
        );

        if (elapsed < totalDuration + 600) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frameRef.current);
    };
  }, [trigger, text, delay]);

  return (
    <span className={className} aria-label={text}>
      {chars.map((c, i) => (
        <span
          key={i}
          className="inline-block transition-none"
          style={{
            transform: `translateY(${c.offsetY}px)`,
            opacity: c.opacity,
            color: c.resolved ? undefined : "rgba(194, 224, 58, 0.5)",
          }}
        >
          {c.display}
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  ClipRevealText — clean horizontal wipe reveal with subtle         */
/*  per-character stagger y-spring. The opposite of chaos.            */
/* ------------------------------------------------------------------ */

export function ClipRevealText({
  text,
  delay = 0,
  className,
  trigger = true,
}: {
  text: string;
  delay?: number;
  className?: string;
  trigger?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const frameRef = useRef(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!trigger || hasRun.current) return;
    hasRun.current = true;

    const timeout = setTimeout(() => {
      const start = performance.now();
      const duration = 900;

      const animate = (now: number) => {
        const elapsed = now - start;
        // Ease out cubic
        const raw = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - raw, 3);
        setProgress(eased);

        if (raw < 1) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frameRef.current);
    };
  }, [trigger, text, delay]);

  return (
    <span className={className} aria-label={text}>
      <span
        className="inline-block overflow-hidden"
        style={{ width: `${progress * 100}%` }}
      >
        <span className="inline-block whitespace-nowrap">
          {text.split("").map((char, i) => {
            // Each character rises up slightly with stagger
            const charDelay = i * 0.04;
            const charProgress = Math.max(0, Math.min(1, (progress - charDelay) / 0.3));
            const y = (1 - charProgress) * 12;
            const spring = charProgress > 0.7
              ? -2 * Math.sin((charProgress - 0.7) / 0.3 * Math.PI) * (1 - charProgress)
              : 0;

            return (
              <span
                key={i}
                className="inline-block"
                style={{
                  transform: `translateY(${y + spring}px)`,
                  opacity: charProgress,
                }}
              >
                {char}
              </span>
            );
          })}
        </span>
      </span>
      {/* Clean cursor that appears during reveal then fades */}
      {progress > 0.05 && progress < 0.98 && (
        <span
          className="inline-block w-[3px] h-[0.85em] bg-lime ml-0.5 align-middle"
          style={{
            opacity: Math.sin(performance.now() * 0.006) > 0 ? 0.9 : 0,
          }}
        />
      )}
    </span>
  );
}
