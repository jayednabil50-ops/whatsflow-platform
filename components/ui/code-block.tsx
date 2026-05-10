"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

type Language = "ts" | "bash" | "python" | "php";

type CodeBlockProps = {
  language: Language;
  code?: string;
  examples?: Partial<Record<Language, string>>;
  title?: string;
};

export function CodeBlock({ language, code = "", examples, title = "API request" }: CodeBlockProps) {
  const [active, setActive] = useState<Language>(language);
  const codeMap = useMemo(
    () => ({
      ts: examples?.ts ?? code,
      bash: examples?.bash ?? code,
      python: examples?.python ?? code,
      php: examples?.php ?? code
    }),
    [code, examples]
  );

  return (
    <div className="overflow-hidden rounded-md border border-border bg-background shadow-[0_22px_70px_rgba(0,0,0,0.24)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex gap-1" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-signal-rose" />
            <span className="h-2.5 w-2.5 rounded-full bg-signal-amber" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
        </div>
        <div className="flex items-center gap-2">
          {(["bash", "ts", "python", "php"] as Language[]).map((tab) => (
            <button
              key={tab}
              className={cn(
                "focus-ring rounded px-2 py-1 text-xs font-medium transition",
                active === tab ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={() => setActive(tab)}
            >
              {tab}
            </button>
          ))}
          <CopyButton value={codeMap[active]} />
        </div>
      </div>
      <pre className="min-h-80 overflow-x-auto p-5 font-mono text-xs leading-6 text-emerald-50">{codeMap[active]}</pre>
    </div>
  );
}
