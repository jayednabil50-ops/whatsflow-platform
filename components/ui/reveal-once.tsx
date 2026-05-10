"use client";

import { useState } from "react";

export function RevealOnce({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false);
  const [locked, setLocked] = useState(false);

  return (
    <div className="rounded-md border border-border bg-background/70 p-3">
      <p className="break-all font-mono text-sm text-accent">{revealed ? value : "wfk_live_****************"}</p>
      <button
        disabled={locked}
        className="focus-ring mt-3 rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-60"
        onClick={() => {
          setRevealed(true);
          setLocked(true);
        }}
      >
        Reveal once
      </button>
    </div>
  );
}
