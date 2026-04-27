import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TopBar } from "./TopBar";

describe("TopBar", () => {
  it("renders the page-header wrapper and quick action", () => {
    const html = renderToStaticMarkup(
      <TopBar
        title="Today"
        eyebrow="Overview"
        subtitle="Your rhythm, goals and the small wins that compound."
        onQuickAdd={() => {}}
        quickAddLabel="New habit"
      />,
    );

    expect(html).toContain('data-slot="page-header"');
    expect(html).toContain("New habit");
  });
});
