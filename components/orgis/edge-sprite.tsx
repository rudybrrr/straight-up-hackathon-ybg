"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Vec2 = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distance(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function positionOnPerimeterBelowTop(
  progress: number,
  width: number,
  height: number,
  inset: number,
  topLimit: number,
  halfSize: number
) {
  // `width` should be `documentElement.clientWidth` so the right edge sits left of the scrollbar.
  const left = inset + halfSize;
  const right = Math.max(left, width - inset - halfSize);
  const top = Math.max(inset + halfSize, topLimit + halfSize);
  const bottom = Math.max(top, height - inset - halfSize);

  const w = Math.max(0, right - left);
  const h = Math.max(0, bottom - top);
  const perimeter = 2 * (w + h);
  const t = perimeter > 0 ? ((progress % perimeter) + perimeter) % perimeter : 0;

  if (t <= w) {
    return { x: left + t, y: top, angle: 0 };
  }
  if (t <= w + h) {
    return { x: left + w, y: top + (t - w), angle: 90 };
  }
  if (t <= 2 * w + h) {
    return { x: left + (w - (t - (w + h))), y: top + h, angle: 180 };
  }
  return { x: left, y: top + (h - (t - (2 * w + h))), angle: 270 };
}

export function EdgeSprite() {
  const [mounted, setMounted] = useState(false);
  const spriteRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pointerRef = useRef<Vec2 | null>(null);
  const progressRef = useRef(0);
  const dirRef = useRef<1 | -1>(1);
  const lastFlipAtRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const topLimitRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const node = spriteRef.current;
    if (!node) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      node.style.opacity = "0";
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleBlur = () => {
      pointerRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", handleBlur);

    const header = document.querySelector("header");
    const updateTopLimit = () => {
      const headerHeight =
        header && header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
      topLimitRef.current = Math.max(0, headerHeight + 12);
    };

    updateTopLimit();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && header && header instanceof HTMLElement) {
      resizeObserver = new ResizeObserver(() => updateTopLimit());
      resizeObserver.observe(header);
    }

    window.addEventListener("resize", updateTopLimit, { passive: true });

    const tick = (ts: number) => {
      const lastTs = lastTsRef.current ?? ts;
      lastTsRef.current = ts;
      const dt = clamp((ts - lastTs) / 1000, 0, 0.05);

      const width = document.documentElement.clientWidth;
      const height = window.innerHeight;
      const inset = 20;
      const spriteSize = 26;
      const halfSize = spriteSize / 2;

      const topLimit = topLimitRef.current;
      const w = Math.max(0, width - inset * 2 - spriteSize);
      const h = Math.max(0, height - inset * 2 - topLimit - spriteSize);
      const perimeter = 2 * (w + h);
      if (perimeter > 0 && progressRef.current === 0) {
        progressRef.current = perimeter * 0.08;
      }

      const pos = positionOnPerimeterBelowTop(
        progressRef.current,
        width,
        height,
        inset,
        topLimit,
        halfSize
      );

      const pointer = pointerRef.current;
      const dist = pointer ? distance(pointer, pos) : Infinity;
      const proximity = pointer ? clamp(1 - dist / 160, 0, 1) : 0;

      const now = performance.now();
      if (proximity > 0.7 && now - lastFlipAtRef.current > 700) {
        dirRef.current = dirRef.current === 1 ? -1 : 1;
        lastFlipAtRef.current = now;
      }

      const baseSpeed = 84; // px/s along the perimeter
      const speed = baseSpeed + proximity * 280;
      progressRef.current += dirRef.current * speed * dt;

      const wobble = Math.sin(ts / 180) * (2 + proximity * 5);
      const pop = 1 + proximity * 0.16;
      const facingAngle = (pos.angle + (dirRef.current === -1 ? 180 : 0)) % 360;

      node.style.transform = `translate3d(${Math.round(pos.x)}px, ${Math.round(
        pos.y + wobble
      )}px, 0) rotate(${facingAngle}deg) scale(${pop})`;
      node.style.setProperty("--orgis-sprite-wobble", wobble.toFixed(2));
      node.style.opacity = pointer ? String(0.92 + proximity * 0.08) : "0.78";

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("resize", updateTopLimit);
      resizeObserver?.disconnect();
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      ref={spriteRef}
      aria-hidden="true"
      className="orgis-sprite pointer-events-none fixed left-0 top-0 z-30"
    >
      <svg width="26" height="26" viewBox="0 0 26 26" className="block" role="presentation">
        <defs>
          <linearGradient id="orgisSprite" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgb(37, 99, 235)" />
            <stop offset="0.6" stopColor="rgb(14, 165, 233)" />
            <stop offset="1" stopColor="rgb(99, 102, 241)" />
          </linearGradient>
        </defs>
        <circle cx="13" cy="13" r="10.5" fill="url(#orgisSprite)" opacity="0.95" />
        <circle cx="13" cy="13" r="10.5" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />

        <g transform={`translate(0 ${0})`}>
          <circle cx="10.1" cy="11.6" r="1.2" fill="rgba(2,6,23,0.85)" />
          <circle cx="15.9" cy="11.6" r="1.2" fill="rgba(2,6,23,0.85)" />
          <path
            d="M10.4 15.2c1.2 1 4 1 5.2 0"
            fill="none"
            stroke="rgba(2,6,23,0.7)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  ,
    document.body
  );
}
