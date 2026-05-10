import { cn } from "@/lib/utils";

export function StatusDot({
  variant
}: {
  variant: "connected" | "connecting" | "disconnected" | "error";
}) {
  const map = {
    connected: "bg-emerald-500",
    connecting: "bg-amber-500 animate-pulse",
    disconnected: "bg-slate-500",
    error: "bg-red-500"
  };
  return <span className={cn("inline-block h-2.5 w-2.5 rounded-full shadow-[0_0_18px_currentColor]", map[variant])} />;
}
