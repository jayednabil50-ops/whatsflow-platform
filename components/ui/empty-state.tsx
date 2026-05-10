import { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";

export function EmptyState({
  icon: Icon,
  title,
  ctaLabel,
  ctaHref
}: {
  icon: LucideIcon;
  title: string;
  ctaLabel: string;
  ctaHref: Route;
}) {
  return (
    <div className="rounded-md border border-dashed border-border bg-card p-8 text-center">
      <Icon className="mx-auto h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-foreground">{title}</p>
      <Link href={ctaHref} className="focus-ring mt-4 inline-flex rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">
        {ctaLabel}
      </Link>
    </div>
  );
}
