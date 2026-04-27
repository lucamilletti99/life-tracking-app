import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RecurrenceBuilder } from "./RecurrenceBuilder";

describe("RecurrenceBuilder", () => {
  it("shows all recurrence options", () => {
    const html = renderToStaticMarkup(
      <RecurrenceBuilder
        type="daily"
        config={{}}
        onTypeChange={() => {}}
        onConfigChange={() => {}}
      />,
    );

    expect(html).toContain("Every day");
    expect(html).toContain("Select days");
    expect(html).toContain("X/week");
    expect(html).toContain("X/month");
    expect(html).toContain("Day of month");
  });

  it("uses single-line horizontal scroll for recurrence chips", () => {
    const html = renderToStaticMarkup(
      <RecurrenceBuilder
        type="daily"
        config={{}}
        onTypeChange={() => {}}
        onConfigChange={() => {}}
      />,
    );

    expect(html).toContain("flex flex-nowrap gap-2 overflow-x-auto");
  });

  it("keeps recurrence detail controls for selected type", () => {
    const weekly = renderToStaticMarkup(
      <RecurrenceBuilder
        type="times_per_week"
        config={{ times_per_period: 2 }}
        onTypeChange={() => {}}
        onConfigChange={() => {}}
      />,
    );
    const dayOfMonth = renderToStaticMarkup(
      <RecurrenceBuilder
        type="day_of_month"
        config={{ day_of_month: 3 }}
        onTypeChange={() => {}}
        onConfigChange={() => {}}
      />,
    );

    expect(weekly).toContain("times per week");
    expect(dayOfMonth).toContain("of each month");
  });
});
