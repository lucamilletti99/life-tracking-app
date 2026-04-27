import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TodayHeader } from "./TodayHeader";

describe("TodayHeader", () => {
  it("renders an accessible daily summary region", () => {
    const html = renderToStaticMarkup(
      <TodayHeader
        today="2026-04-22"
        totalHabits={7}
        completedHabits={5}
        habitsWithActiveStreak={3}
      />,
    );

    expect(html).toContain('aria-label="Daily summary"');
    expect(html).toContain("Completion");
  });
});
