import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AnalyticsControls } from "@/components/analytics/AnalyticsControls";
import { parseStoredControls } from "@/hooks/useAnalyticsControls";

describe("AnalyticsControls", () => {
  it("hides manual date inputs until Custom is selected", () => {
    const html = renderToStaticMarkup(
      <AnalyticsControls
        controls={{
          startDate: "2026-04-01",
          endDate: "2026-05-30",
          granularity: "weekly",
          comparisonEnabled: true,
          presetKey: "2m",
        }}
        presets={["1m", "2m", "3m", "6m", "1y", "2y"]}
        onPresetChange={() => {}}
        onRangeChange={() => {}}
        onGranularityChange={() => {}}
        onComparisonToggle={() => {}}
        onRefresh={() => {}}
        refreshing={false}
      />,
    );

    expect(html).toContain("Analytics controls");
    expect(html).toContain(">2M<");
    expect(html).toContain(">Custom<");
    expect(html).toContain("Granularity");
    expect(html).toContain("Compare previous period");
    expect(html).not.toContain('type="date"');
  });

  it("shows manual date inputs when the custom range is active", () => {
    const html = renderToStaticMarkup(
      <AnalyticsControls
        controls={{
          startDate: "2026-04-01",
          endDate: "2026-05-30",
          granularity: "weekly",
          comparisonEnabled: false,
          presetKey: "custom",
        }}
        presets={["1m", "2m", "3m", "6m", "1y", "2y"]}
        onPresetChange={() => {}}
        onRangeChange={() => {}}
        onGranularityChange={() => {}}
        onComparisonToggle={() => {}}
        onRefresh={() => {}}
        refreshing={false}
      />,
    );

    expect((html.match(/type="date"/g) ?? [])).toHaveLength(2);
    expect(html).toContain("Granularity");
    expect(html).toContain("Compare previous period");
  });

  it("shows refreshing label when refresh is in progress", () => {
    const html = renderToStaticMarkup(
      <AnalyticsControls
        controls={{
          startDate: "2026-04-01",
          endDate: "2026-05-30",
          granularity: "weekly",
          comparisonEnabled: false,
          presetKey: "custom",
        }}
        presets={["1m", "2m", "3m", "6m", "1y", "2y"]}
        onPresetChange={() => {}}
        onRangeChange={() => {}}
        onGranularityChange={() => {}}
        onComparisonToggle={() => {}}
        onRefresh={() => {}}
        refreshing
      />,
    );

    expect(html).toContain("Refreshing...");
  });
});

describe("parseStoredControls", () => {
  it("returns null for invalid JSON payload", () => {
    expect(parseStoredControls("not-json")).toBeNull();
  });

  it("returns null for missing required fields", () => {
    expect(parseStoredControls(JSON.stringify({ startDate: "2026-01-01" }))).toBeNull();
  });

  it("clamps restored ranges and preserves valid controls", () => {
    const parsed = parseStoredControls(
      JSON.stringify({
        startDate: "2026-04-20",
        endDate: "2026-04-22",
        granularity: "daily",
        comparisonEnabled: true,
        presetKey: "custom",
      }),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.endDate).toBe("2026-04-22");
    expect(parsed?.startDate).toBe("2026-03-24"); // clamped to 30 days
    expect(parsed?.granularity).toBe("daily");
  });
});
