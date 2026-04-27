"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Root route — redirect to /today.
// Must be client-side: server-side redirect() is incompatible with
// static export (output: 'export') required for Capacitor.
export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/today");
  }, [router]);

  return null;
}
