import { describe, expect, it } from "vitest";

import { DARK_THEME_COLOR, LIGHT_THEME_COLOR } from "./theme-meta";

describe("theme meta colors", () => {
  it("exports stable browser chrome colors for both themes", () => {
    expect(LIGHT_THEME_COLOR).toBe("#f4efe4");
    expect(DARK_THEME_COLOR).toBe("#151515");
  });
});
