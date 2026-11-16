"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE =
  'a, button, [role="button"], input, select, textarea, label, summary, [data-cursor="hover"]';

/**
 * Soft cursor ring that trails the mouse, grows over clickable things and
 * sends out a small ripple on click. Desktop mice only: it never mounts on
 * touch screens or when the user asks for reduced motion. The real cursor
 * stays visible, so nothing about clicking changes.
 */
export function CursorFollower() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot || !fine.matches || reduced.matches) return;

    let x = -100;
    let y = -100;
    let rx = x;
    let ry = y;
    let frame = 0;
    let visible = false;

    const tick = () => {
      // Ease the ring toward the pointer: a short, gentle delay.
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      ring.style.translate = `${rx}px ${ry}px`;
      if (Math.abs(x - rx) > 0.1 || Math.abs(y - ry) > 0.1) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      dot.style.translate = `${x}px ${y}px`;
      if (!visible) {
        visible = true;
        rx = x;
        ry = y;
        document.documentElement.dataset.cursor = "on";
      }
      const target = e.target as Element | null;
      const hovering = !!target?.closest?.(INTERACTIVE);
      ring.dataset.hover = hovering ? "true" : "false";
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onDown = () => (ring.dataset.down = "true");
    const onUp = () => (ring.dataset.down = "false");

    const onClick = (e: MouseEvent) => {
      if (e.detail === 0) return; // keyboard "click"
      const ripple = document.createElement("span");
      ripple.className = "cursor-ripple";
      ripple.style.translate = `${e.clientX}px ${e.clientY}px`;
      document.body.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), {
        once: true,
      });
    };

    const onLeave = () => {
      visible = false;
      delete document.documentElement.dataset.cursor;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("click", onClick);
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("click", onClick);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      delete document.documentElement.dataset.cursor;
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden />
      <div ref={dotRef} className="cursor-dot" aria-hidden />
    </>
  );
}
