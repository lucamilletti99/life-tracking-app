import type { ReactNode } from "react";

import { AnalyticsStateProvider } from "@/components/analytics/AnalyticsStateProvider";

export default function AnalyticsLayout({ children }: { children: ReactNode }) {
  return <AnalyticsStateProvider>{children}</AnalyticsStateProvider>;
}
