"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-5">
        <p className="text-[15px] font-medium text-destructive">Something went wrong</p>
        <p className="mt-1 text-[13px] text-ink-subtle">
          {error.message ?? "An unexpected error occurred."}
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-lg border border-hairline bg-surface px-4 py-2 text-[13px] font-medium text-ink transition-chrome hover:bg-surface-elevated"
      >
        Try again
      </button>
    </div>
  );
}
