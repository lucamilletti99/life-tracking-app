import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LogForm } from "./LogForm";

describe("LogForm", () => {
  it("does not render a numeric value field for yes/no habits", () => {
    const html = renderToStaticMarkup(
      <LogForm
        trackingType="boolean"
        onSubmit={() => {}}
      />,
    );

    expect(html).not.toContain("Value");
    expect(html).not.toContain('type="number"');
    expect(html).toContain("Mark complete");
  });

  it("renders a measurement field with unit for measure habits", () => {
    const html = renderToStaticMarkup(
      <LogForm
        trackingType="measurement"
        unit="lbs"
        onSubmit={() => {}}
      />,
    );

    expect(html).toContain("Value (lbs)");
    expect(html).toContain('type="number"');
  });

  it("renders a time field label for duration habits", () => {
    const html = renderToStaticMarkup(
      <LogForm
        trackingType="duration"
        unit="min"
        onSubmit={() => {}}
      />,
    );

    expect(html).toContain("Time (min)");
    expect(html).toContain('type="number"');
  });
});
