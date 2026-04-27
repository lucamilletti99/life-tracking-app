"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { LoginCard } from "@/components/auth/LoginCard";
import { resolvePostLoginPath } from "@/lib/auth/session";

function LoginContent() {
  const searchParams = useSearchParams();
  const nextValue = searchParams.get("next") ?? undefined;
  const nextPath = resolvePostLoginPath(nextValue);
  return <LoginCard nextPath={nextPath} />;
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      {/* Soft editorial backdrop — barely-there ember glow in top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 80% -10%, var(--ember-soft), transparent 45%)",
        }}
      />
      <div className="relative">
        <Suspense fallback={<LoginCard nextPath="/calendar" />}>
          <LoginContent />
        </Suspense>
      </div>
    </main>
  );
}
