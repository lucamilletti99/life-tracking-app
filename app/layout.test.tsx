import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-geist-sans" }),
  Geist_Mono: () => ({ variable: "font-geist-mono" }),
}));

vi.mock("@/components/theme/ThemeProvider", () => ({
  ThemeProvider: ({ children }: { children: unknown }) => <>{children}</>,
  themeBootScript: "window.__TRACKR_THEME__ = true;",
}));

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("adds data-scroll-behavior=smooth when html uses smooth scroll", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <div>App</div>
      </RootLayout>,
    );

    expect(html).toContain('data-scroll-behavior="smooth"');
  });
});
