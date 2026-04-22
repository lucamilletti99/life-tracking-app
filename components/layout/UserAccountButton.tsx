"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogOut, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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

export function UserAccountButton() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    async function loadUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (mounted) setUser(currentUser);
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
      await supabase.auth.signOut();
      window.location.assign("/login");
    } finally {
      setSigningOut(false);
    }
  }

  if (!user) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40">
      <div className="pointer-events-auto relative">
        {open && (
          <div className="mb-2 w-72 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Account
            </p>
            <p className="mt-2 truncate text-sm font-medium text-neutral-900">{userLabel}</p>
            <p className="mt-1 text-xs text-neutral-500">
              First login: {formatFirstLogin(user.created_at)}
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
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-md transition-colors hover:bg-neutral-50"
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
