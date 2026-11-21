"use client";

import { useEffect, useRef } from "react";

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const deg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Two beams hung from the top corners. With a mouse, each beam turns to aim
 * at the cursor from its own corner and a patch of the grid lights up under
 * it; on touch screens or with reduced motion they stay at their 45° rest.
 *
 * Place it as the first child of a `relative isolate overflow-hidden`
 * element: it listens to pointer moves on that parent.
 */
export function Spotlight({ size = "hero" }: { size?: "hero" | "page" }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    const canTrack = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    if (!canTrack.matches) return;

    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    const paint = () => {
      frame = 0;
      if (!pointer) return;
      const box = el.getBoundingClientRect();
      const x = pointer.x - box.left;
      const y = pointer.y - box.top;
      // Beams hang from 12% above the top edge (see .hero-spotlight-beam).
      const drop = Math.max(y + box.height * 0.12, 1);
      const aimLeft = clamp(-deg(Math.atan2(x, drop)), -72, -18);
      const aimRight = clamp(deg(Math.atan2(box.width - x, drop)), 18, 72);
      el.style.setProperty("--tilt-left", `${aimLeft + 45}deg`);
      el.style.setProperty("--tilt-right", `${aimRight - 45}deg`);
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      el.style.setProperty("--lamp", "1");
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onLeave = () => {
      pointer = null;
      el.style.setProperty("--tilt-left", "0deg");
      el.style.setProperty("--tilt-right", "0deg");
      el.style.setProperty("--lamp", "0");
    };

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-size={size}
      className="hero-spotlight -z-10"
    >
      <div className="hero-spotlight-beam hero-spotlight-beam--left" />
      <div className="hero-spotlight-beam hero-spotlight-beam--right" />
    </div>
  );
}
