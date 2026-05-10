export function KeyboardShortcut({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      {keys.map((key) => (
        <kbd key={key} className="rounded border border-border bg-card px-1.5 py-0.5 font-mono">
          {key}
        </kbd>
      ))}
    </span>
  );
}
