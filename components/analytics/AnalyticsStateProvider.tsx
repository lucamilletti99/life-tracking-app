"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useAnalyticsControls } from "@/hooks/useAnalyticsControls";
import { useAnalyticsDataset } from "@/hooks/useAnalyticsDataset";

interface AnalyticsStateContextValue {
  controls: ReturnType<typeof useAnalyticsControls>;
  dataset: ReturnType<typeof useAnalyticsDataset>;
}

const AnalyticsStateContext = createContext<AnalyticsStateContextValue | null>(null);

export function AnalyticsStateProvider({ children }: { children: ReactNode }) {
  const controls = useAnalyticsControls();
  const dataset = useAnalyticsDataset();

  const value = useMemo(
    () => ({ controls, dataset }),
    [controls, dataset],
  );

  return (
    <AnalyticsStateContext.Provider value={value}>
      {children}
    </AnalyticsStateContext.Provider>
  );
}

export function useAnalyticsState() {
  const context = useContext(AnalyticsStateContext);
  if (!context) {
    throw new Error("useAnalyticsState must be used within AnalyticsStateProvider");
  }
  return context;
}
