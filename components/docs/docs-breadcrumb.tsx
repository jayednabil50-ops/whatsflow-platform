import { ChevronRight } from "lucide-react";

type Crumb = { label: string; href?: string };

export function DocsBreadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.label} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-white/20" />}
            {!isLast && crumb.href ? (
              <a
                href={crumb.href}
                className="text-white/40 transition hover:text-white/70"
              >
                {crumb.label}
              </a>
            ) : (
              <span className={isLast ? "text-white/70" : "text-white/40"}>{crumb.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
