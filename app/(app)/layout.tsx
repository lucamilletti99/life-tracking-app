import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { GlobalFAB } from "@/components/layout/GlobalFAB";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomTabBar } from "@/components/layout/BottomTabBar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content area */}
      <main className={[
        "relative flex flex-1 flex-col overflow-hidden",
        "bg-[radial-gradient(circle_at_top,rgba(230,152,74,0.08),transparent_28%),linear-gradient(180deg,var(--background),var(--background))]",
        // On mobile, leave room at the bottom for the floating tab bar
        "pb-0 md:pb-0",
      ].join(" ")}>
        {children}
      </main>

      {/*
        GlobalFAB — visible on all sizes.
        On mobile it floats above the BottomTabBar; Tailwind handles positioning
        via the responsive bottom value set inside GlobalFAB itself.
      */}
      <GlobalFAB />

      {/* Bottom tab bar — mobile only */}
      <div className="md:hidden">
        <BottomTabBar />
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          className:
            "!bg-surface-elevated !text-ink !border !border-hairline !shadow-[var(--shadow-lifted)]",
        }}
      />
    </div>
  );
}
