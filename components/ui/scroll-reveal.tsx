"use client";

import { useEffect, useRef, useState, type ReactNode, type ElementType } from "react";
import { cn } from "@/lib/utils";

type Direction = "up" | "left" | "right" | "scale";

export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className,
  as: Tag = "div",
  threshold = 0.12,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
  as?: ElementType;
  threshold?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold, rootMargin: "0px 0px -48px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const directionClass =
    direction === "left" ? "from-left" :
    direction === "right" ? "from-right" :
    direction === "scale" ? "scale" : "";

  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", directionClass, visible && "is-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
