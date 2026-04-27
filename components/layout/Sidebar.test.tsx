import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const prefetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/today",
  useRouter: () => ({ prefetch: prefetchMock }),
}));

vi.mock("@/components/theme/ThemeToggle", () => ({
  ThemeToggle: () => <div>Theme toggle</div>,
}));

vi.mock("@/components/layout/UserAccountButton", () => ({
  UserAccountButton: () => <div>Account button</div>,
}));

vi.mock("lucide-react", () => ({
  BarChart2: () => <svg />,
  Calendar: () => <svg />,
  CalendarCheck2: () => <svg />,
  Repeat: () => <svg />,
  Target: () => <svg />,
}));

import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("marks the active route with aria-current", () => {
    const html = renderToStaticMarkup(<Sidebar />);

    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Workspace");
  });
});
