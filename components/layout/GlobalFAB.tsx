"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Repeat, Target } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

export function GlobalFAB() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    router.prefetch("/goals");
    router.prefetch("/habits");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on Escape and restore focus to trigger
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
      // Trap Tab within the open menu
      if (e.key === "Tab") {
        const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled])",
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    // Move focus into the menu when it opens
    const firstItem = menuRef.current?.querySelector<HTMLElement>("button");
    firstItem?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function navigate(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <>
      {/* Backdrop to close on outside click */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/*
        Desktop: bottom-7 right-7
        Mobile:  sits above the floating tab bar (~88px from bottom so it
                 clears the pill + safe-area).
      */}
      <div className="fixed bottom-[88px] right-5 z-50 flex flex-col items-end gap-2 md:bottom-7 md:right-7">
        {/* Speed dial options */}
        <div
          ref={menuRef}
          role="menu"
          aria-label="Quick add options"
          className={cn(
            "flex flex-col items-end gap-2 transition-all duration-200",
            open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
          )}
        >
          <button
            role="menuitem"
            tabIndex={open ? 0 : -1}
            onClick={() => navigate("/goals")}
            className="flex items-center gap-2.5 rounded-full border border-hairline bg-surface-elevated px-4 py-2.5 text-[13px] font-medium text-ink shadow-[var(--shadow-lifted)] transition-chrome hover:border-hairline-strong hover:bg-surface"
          >
            <Target size={14} className="text-ember" />
            New Goal
          </button>
          <button
            role="menuitem"
            tabIndex={open ? 0 : -1}
            onClick={() => navigate("/habits")}
            className="flex items-center gap-2.5 rounded-full border border-hairline bg-surface-elevated px-4 py-2.5 text-[13px] font-medium text-ink shadow-[var(--shadow-lifted)] transition-chrome hover:border-hairline-strong hover:bg-surface"
          >
            <Repeat size={14} className="text-ember" />
            New Habit
          </button>
        </div>

        {/* FAB trigger */}
        <button
          ref={triggerRef}
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Close menu" : "Quick add"}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full shadow-[var(--shadow-lifted)] transition-chrome",
            "bg-ink text-background hover:bg-ink/85 active:scale-95",
          )}
        >
          <Plus
            size={20}
            strokeWidth={2.25}
            className={cn("transition-transform duration-200", open && "rotate-45")}
          />
        </button>
      </div>
    </>
  );
}
