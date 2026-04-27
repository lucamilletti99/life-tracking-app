"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

interface SafeResponsiveContainerProps {
  children: ReactNode;
  minHeight?: number;
}

/**
 * Wraps recharts' ResponsiveContainer and defers rendering until the host
 * element has real pixel dimensions. This prevents the spurious
 * "width(-1) and height(-1) of chart should be greater than 0" warning that
 * fires when ResponsiveContainer mounts before the browser has laid out its
 * parent (common with dynamic imports and dialog/tab transitions).
 */
export function SafeResponsiveContainer({
  children,
  minHeight = 1,
}: SafeResponsiveContainerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // Already has width — render immediately.
    if (el.clientWidth > 0) {
      setReady(true);
      return;
    }

    // Otherwise wait for the first ResizeObserver tick with real dimensions.
    const ro = new ResizeObserver(() => {
      if (el.clientWidth > 0) {
        setReady(true);
        ro.disconnect();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: "100%", minHeight }}>
      {ready && (
        <ResponsiveContainer width="100%" height="100%" minHeight={minHeight}>
          {children}
        </ResponsiveContainer>
      )}
    </div>
  );
}
