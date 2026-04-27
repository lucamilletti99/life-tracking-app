import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({
    children,
    width,
    height,
    minWidth,
    minHeight,
  }: {
    children: unknown;
    width?: string | number;
    height?: string | number;
    minWidth?: number;
    minHeight?: number;
  }) => (
    <div
      data-height={String(height)}
      data-min-height={String(minHeight)}
      data-min-width={String(minWidth)}
      data-width={String(width)}
    >
      {children}
    </div>
  ),
}));

import { SafeResponsiveContainer } from "./SafeResponsiveContainer";

describe("SafeResponsiveContainer", () => {
  it("renders a safe wrapper before the container is layout-ready", () => {
    const html = renderToStaticMarkup(
      <SafeResponsiveContainer>
        <div>Chart</div>
      </SafeResponsiveContainer>,
    );

    expect(html).toContain('style="width:100%;height:100%;min-height:1px"');
    expect(html).not.toContain("Chart");
    expect(html).not.toContain("data-width=");
  });
});
