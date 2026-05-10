import { ArrowLeft, ArrowRight } from "lucide-react";

type NavItem = { label: string; href: string };

export function DocsPageNav({
  prev,
  next,
}: {
  prev?: NavItem;
  next?: NavItem;
}) {
  return (
    <div className="mt-14 flex flex-col gap-3 border-t border-white/[0.06] pt-8 sm:flex-row">
      {prev ? (
        <a
          href={prev.href}
          className="group flex flex-1 items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 text-sm transition-all hover:border-white/[0.14] hover:bg-white/[0.05]"
        >
          <ArrowLeft className="h-4 w-4 text-white/40 transition group-hover:text-emerald-400" />
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-0.5">Previous</p>
            <p className="font-medium text-white/70 group-hover:text-white transition">{prev.label}</p>
          </div>
        </a>
      ) : (
        <div className="flex-1" />
      )}

      {next && (
        <a
          href={next.href}
          className="group flex flex-1 items-center justify-end gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 text-sm transition-all hover:border-emerald-500/30 hover:bg-emerald-500/[0.04]"
        >
          <div className="text-right">
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-0.5">Next</p>
            <p className="font-medium text-white/70 group-hover:text-emerald-400 transition">{next.label}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-white/40 transition group-hover:text-emerald-400" />
        </a>
      )}
    </div>
  );
}
