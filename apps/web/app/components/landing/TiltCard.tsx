"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Tilts its children toward the cursor (a few degrees, eased back on
 *  leave). Mouse only; touch screens and reduced motion get a flat card.
 *  Children marked `.tilt-pop` float above the card in 3D. */
export function TiltCard({
  children,
  max = 7,
  className = "",
}: {
  children: ReactNode;
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const canTilt = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    if (!canTilt.matches) return;

    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    const paint = () => {
      frame = 0;
      if (!pointer) return;
      const box = el.getBoundingClientRect();
      // -0.5 … 0.5 across the card.
      const px = (pointer.x - box.left) / box.width - 0.5;
      const py = (pointer.y - box.top) / box.height - 0.5;
      el.style.setProperty("--ry", `${(px * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${(-py * max * 2).toFixed(2)}deg`);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer = { x: e.clientX, y: e.clientY };
      el.dataset.tracking = "true";
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onLeave = () => {
      pointer = null;
      delete el.dataset.tracking;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [max]);

  return (
    <div ref={ref} className={`tilt ${className}`}>
      {children}
    </div>
  );
}
