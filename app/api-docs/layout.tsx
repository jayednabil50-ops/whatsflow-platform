import type { ReactNode } from "react";
import { DocsSidebar } from "@/components/docs/docs-sidebar";

export default function ApiDocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#e5e7eb]">
      {/* Left navigation sidebar */}
      <DocsSidebar />

      {/* Main content area */}
      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}
