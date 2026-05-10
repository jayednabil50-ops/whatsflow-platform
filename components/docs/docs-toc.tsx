"use client";

import { useEffect, useRef, useState } from "react";

export type TocItem = { id: string; label: string };

export function DocsToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        /* pick the topmost visible heading */
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="hidden xl:block">
      <nav className="sticky top-24 w-52">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/30">
          On this page
        </p>
        <ul className="space-y-1 border-l border-white/[0.06]">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`block -ml-px border-l-2 py-1 pl-4 text-[13px] transition-all duration-150 leading-snug ${
                    isActive
                      ? "border-emerald-500 font-medium text-emerald-400"
                      : "border-transparent text-white/35 hover:text-white/65 hover:border-white/20"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
