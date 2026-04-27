"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768; // md in Tailwind

/**
 * Returns true when the viewport is narrower than the md breakpoint (768px).
 * Initialises to false on the server / before hydration to avoid layout shift.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    function onChange(e: MediaQueryListEvent | MediaQueryList) {
      setIsMobile(e.matches);
    }

    // Set initial value
    onChange(mq);

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
