import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "info" | "warning" | "success";

const CONFIG: Record<
  Variant,
  { icon: typeof Info; border: string; bg: string; text: string; iconColor: string }
> = {
  info: {
    icon: Info,
    border: "border-blue-500/40",
    bg: "bg-blue-500/[0.07]",
    text: "text-blue-300/90",
    iconColor: "text-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-amber-500/40",
    bg: "bg-amber-500/[0.07]",
    text: "text-amber-200/90",
    iconColor: "text-amber-400",
  },
  success: {
    icon: CheckCircle2,
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/[0.07]",
    text: "text-emerald-300/90",
    iconColor: "text-emerald-400",
  },
};

export function DocsCallout({
  variant = "info",
  children,
}: {
  variant?: Variant;
  children: ReactNode;
}) {
  const { icon: Icon, border, bg, text, iconColor } = CONFIG[variant];

  return (
    <div
      className={`my-5 flex gap-3 rounded-xl border-l-4 ${border} ${bg} px-4 py-3.5`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
      <div className={`text-sm leading-7 ${text}`}>{children}</div>
    </div>
  );
}
