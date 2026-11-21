"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up from zero to `value` once, the first time it scrolls into view. Screen
 *  readers and reduced-motion users get the final figure straight away. */
export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  duration = 1200,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  const final = `${prefix}${value.toFixed(decimals)}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    // The real figure stays on screen until the first animation frame
    // replaces it, so a missed observer or frame never leaves "৳0.00".
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setShown(value * eased);
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref}>
      <span className="sr-only">{final}</span>
      <span aria-hidden="true">
        {prefix}
        {shown.toFixed(decimals)}
      </span>
    </span>
  );
}
