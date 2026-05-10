"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyButton({ value }: { value: string }) {
  return (
    <button
      className="focus-ring inline-flex items-center gap-1 rounded-md border border-border bg-background/60 px-2 py-1 text-xs font-medium text-muted-foreground transition hover:border-accent/50 hover:text-foreground"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        toast.success("Copied");
      }}
      title="Copy"
    >
      <Copy className="h-3 w-3" />
      Copy
    </button>
  );
}
