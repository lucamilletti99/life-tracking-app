import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { Sidebar } from "@/components/layout/Sidebar";
import { UserAccountButton } from "@/components/layout/UserAccountButton";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      <UserAccountButton />
      <Toaster position="bottom-right" />
    </div>
  );
}
