"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function AnimatedNumber({
  value,
  durationMs = 800,
  format,
  suffix,
  prefix,
  className,
  flashOnChange = true,
}: {
  value: number;
  durationMs?: number;
  format?: (n: number) => string;
  suffix?: string;
  prefix?: string;
  className?: string;
  flashOnChange?: boolean;
}) {
  const [display, setDisplay] = useState(value);
  const [flashKey, setFlashKey] = useState(0);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    if (value === fromRef.current) return;

    if (flashOnChange) {
      setFlashKey((k) => k + 1);
    }

    const from = fromRef.current;
    const to = value;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // ease-out-quart
      const eased = 1 - Math.pow(1 - t, 4);
      const current = from + (to - from) * eased;
      setDisplay(Number.isInteger(from) && Number.isInteger(to) ? Math.round(current) : current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs, flashOnChange]);

  const formatted = format ? format(display) : display.toLocaleString();

  return (
    <span
      key={flashKey}
      className={cn(flashOnChange && flashKey > 0 && "tick-flash", className)}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
