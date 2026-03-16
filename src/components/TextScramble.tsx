"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?<>{}[]";

/**
 * Text that scrambles through random characters before resolving.
 * Evokes "complexity" — chaos resolving into meaning.
 */
export function ScrambleText({
  text,
  delay = 0,
  duration = 2000,
  className,
  trigger = true,
}: {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
  trigger?: boolean;
}) {
  const [display, setDisplay] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!trigger || hasRun.current) return;
    hasRun.current = true;

    const timeout = setTimeout(() => {
      let iteration = 0;
      const totalIterations = Math.ceil(duration / 30);

      intervalRef.current = setInterval(() => {
        const progress = iteration / totalIterations;
        const resolvedCount = Math.floor(progress * text.length);

        const result = text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < resolvedCount) return text[i];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("");

        setDisplay(result);
        iteration++;

        if (iteration > totalIterations) {
          setDisplay(text);
          clearInterval(intervalRef.current);
        }
      }, 30);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current);
    };
  }, [trigger, text, delay, duration]);

  return (
    <span className={className}>
      {display || "\u00A0".repeat(text.length)}
    </span>
  );
}

/**
 * Text that types in cleanly, character by character.
 * Evokes "clarity" — purposeful, deliberate appearance.
 */
export function TypeRevealText({
  text,
  delay = 0,
  speed = 80,
  className,
  trigger = true,
}: {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  trigger?: boolean;
}) {
  const [display, setDisplay] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!trigger || hasRun.current) return;
    hasRun.current = true;

    const startTimeout = setTimeout(() => {
      setShowCursor(true);
      let i = 0;

      const interval = setInterval(() => {
        i++;
        setDisplay(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          // Hide cursor after a beat
          setTimeout(() => setShowCursor(false), 600);
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [trigger, text, delay, speed]);

  return (
    <span className={className}>
      {display}
      {showCursor && (
        <span className="animate-pulse text-lime">|</span>
      )}
    </span>
  );
}
