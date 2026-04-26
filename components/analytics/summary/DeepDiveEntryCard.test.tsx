import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DeepDiveEntryCard } from "@/components/analytics/summary/DeepDiveEntryCard";

describe("DeepDiveEntryCard", () => {
  it("renders an explicit open cue for navigation affordance", () => {
    const html = renderToStaticMarkup(
      <DeepDiveEntryCard
        title="Progress deep-dive"
        description="Open all habit and goal charts in one combined analytics page."
        href="/analytics/progress"
      />,
    );

    expect(html).toContain("Progress deep-dive");
    expect(html).toContain(">Open<");
    expect(html).toContain("group");
  });
});
