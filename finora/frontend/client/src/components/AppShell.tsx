import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  contentClassName?: string;
}

export function AppShell({ title, subtitle, children, contentClassName }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <div className={`p-4 space-y-6 ${contentClassName ?? ""}`}>{children}</div>
        </main>
      </div>
    </div>
  );
}
