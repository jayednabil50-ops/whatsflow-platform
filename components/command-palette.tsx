"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect } from "react";
import { commandItems } from "@/lib/mocks/data";
import { useUIStore } from "@/lib/stores/ui-store";

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useUIStore();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(!commandOpen);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandOpen, setCommandOpen]);

  if (!commandOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4 backdrop-blur-sm" onClick={() => setCommandOpen(false)}>
      <div
        className="mx-auto mt-24 w-full max-w-xl overflow-hidden rounded-md border border-border bg-card shadow-[0_28px_90px_rgba(0,0,0,0.48)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search commands, pages, sessions..."
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">esc</kbd>
        </div>
        <div className="grid gap-1 p-2">
          {commandItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setCommandOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4 text-accent" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
