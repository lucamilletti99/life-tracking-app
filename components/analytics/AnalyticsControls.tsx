"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import type { AnalyticsControlsState, AnalyticsPresetKey } from "@/lib/analytics/types";

interface AnalyticsControlsProps {
  controls: AnalyticsControlsState;
  presets: Array<Exclude<AnalyticsPresetKey, "custom">>;
  onPresetChange: (preset: AnalyticsPresetKey) => void;
  onRangeChange: (startDate: string, endDate: string) => void;
  onGranularityChange: (value: AnalyticsControlsState["granularity"]) => void;
  onComparisonToggle: (enabled: boolean) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const PRESET_LABELS: Record<Exclude<AnalyticsPresetKey, "custom">, string> = {
  "1m": "1M",
  "2m": "2M",
  "3m": "3M",
  "6m": "6M",
  "1y": "1Y",
  "2y": "2Y",
};

export function AnalyticsControls({
  controls,
  presets,
  onPresetChange,
  onRangeChange,
  onGranularityChange,
  onComparisonToggle,
  onRefresh,
  refreshing,
}: AnalyticsControlsProps) {
  const minDate = useMemo(() => {
    const end = new Date(`${controls.endDate}T00:00:00`);
    end.setDate(end.getDate() - (730 - 1));
    return end.toISOString().slice(0, 10);
  }, [controls.endDate]);

  const presetOptions: AnalyticsPresetKey[] = [...presets, "custom"];

  return (
    <section className="surface-card p-4" aria-label="Analytics controls">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-eyebrow">Range</span>
          {presetOptions.map((preset) => (
            <Button
              key={preset}
              type="button"
              size="sm"
              variant={controls.presetKey === preset ? "default" : "outline"}
              onClick={() => onPresetChange(preset)}
            >
              {preset === "custom" ? "Custom" : PRESET_LABELS[preset]}
            </Button>
          ))}
        </div>

        {controls.presetKey === "custom" && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-[12px] text-ink-muted">
              Start
              <input
                className="mt-1 w-full rounded-md border border-hairline bg-surface px-2.5 py-2 text-[13px] text-ink"
                type="date"
                value={controls.startDate}
                min={minDate}
                max={controls.endDate}
                onChange={(event) => onRangeChange(event.target.value, controls.endDate)}
              />
            </label>

            <label className="text-[12px] text-ink-muted">
              End
              <input
                className="mt-1 w-full rounded-md border border-hairline bg-surface px-2.5 py-2 text-[13px] text-ink"
                type="date"
                value={controls.endDate}
                min={controls.startDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => onRangeChange(controls.startDate, event.target.value)}
              />
            </label>
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-[12px] text-ink-muted">
              Granularity
              <select
                className="mt-1 w-full rounded-md border border-hairline bg-surface px-2.5 py-2 text-[13px] text-ink"
                value={controls.granularity}
                onChange={(event) =>
                  onGranularityChange(event.target.value as AnalyticsControlsState["granularity"])
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>

            <label className="flex items-center gap-2 pt-4 text-[12px] text-ink-muted">
              <input
                type="checkbox"
                checked={controls.comparisonEnabled}
                onChange={(event) => onComparisonToggle(event.target.checked)}
              />
              Compare previous period
            </label>
          </div>

          <Button type="button" size="sm" variant="outline" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>
    </section>
  );
}
