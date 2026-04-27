"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogOut, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatErrorDetails } from "@/lib/error-formatting";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/supabase/client";

function formatFirstLogin(value: string | undefined): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface UserAccountButtonProps {
  /** "floating" = fixed bottom-right (legacy). "inline" = sidebar footer. */
  variant?: "floating" | "inline";
}

export function UserAccountButton({ variant = "floating" }: UserAccountButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    async function loadUser() {
      try {
        const {
          data: { user: currentUser },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        if (mounted) setUser(currentUser);
      } catch (error) {
        console.error("[auth] load current user failed", formatErrorDetails(error));
      }
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const userLabel = useMemo(
    () => user?.email ?? user?.user_metadata?.full_name ?? "Signed in",
    [user],
  );

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.assign("/login");
    } catch (error) {
      console.error("[auth] sign out failed", formatErrorDetails(error));
    } finally {
      setSigningOut(false);
    }
  }

  if (!user) return null;

  const popoverContent = open && (
    <div
      className={cn(
        "rounded-xl border border-hairline bg-popover p-3 shadow-[var(--shadow-lifted)]",
        variant === "floating" ? "mb-2 w-72" : "mb-2",
      )}
    >
      <p className="text-eyebrow">Account</p>
      <p className="mt-2 truncate text-[13px] font-medium text-ink">{userLabel}</p>
      <p className="mt-0.5 text-[11px] text-ink-subtle">
        Joined {formatFirstLogin(user.created_at)}
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full justify-start gap-2"
        onClick={() => void handleSignOut()}
        disabled={signingOut}
      >
        <LogOut className="h-4 w-4" />
        {signingOut ? "Signing out..." : "Log out"}
      </Button>
    </div>
  );

  if (variant === "inline") {
    return (
      <div className="relative">
        {popoverContent}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-lg border border-hairline bg-surface px-3 py-2 text-[12.5px] font-medium text-ink-muted transition-chrome hover:border-hairline-strong hover:text-ink"
          aria-expanded={open}
          aria-label="Account menu"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ember-soft text-ember">
            <UserCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          </div>
          <span className="min-w-0 flex-1 truncate text-left">{userLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40">
      <div className="pointer-events-auto relative">
        {popoverContent}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-2 text-sm font-medium text-ink transition-chrome hover:border-hairline-strong"
          aria-expanded={open}
          aria-label="Account menu"
        >
          <UserCircle2 className="h-4 w-4" />
          <span className="max-w-40 truncate">{userLabel}</span>
        </button>
      </div>
    </div>
  );
}
