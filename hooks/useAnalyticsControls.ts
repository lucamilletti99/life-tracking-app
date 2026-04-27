"use client";

import { format, subDays } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import { clampAnalyticsRange } from "@/lib/analytics/timeframe";
import type {
  AnalyticsControlsState,
  AnalyticsGranularity,
  AnalyticsPresetKey,
} from "@/lib/analytics/types";

const STORAGE_KEY = "analytics_controls_v1";

const PRESET_DAYS: Record<Exclude<AnalyticsPresetKey, "custom">, number> = {
  "1m": 30,
  "2m": 60,
  "3m": 90,
  "6m": 180,
  "1y": 365,
  "2y": 730,
};

function isoToday(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function defaultControls(): AnalyticsControlsState {
  const endDate = isoToday();
  const startDate = format(subDays(new Date(`${endDate}T00:00:00`), 59), "yyyy-MM-dd");
  const clamped = clampAnalyticsRange({ startDate, endDate });

  return {
    startDate: clamped.startDate,
    endDate: clamped.endDate,
    granularity: "daily",
    comparisonEnabled: true,
    presetKey: "2m",
  };
}

function initialControls(): AnalyticsControlsState {
  if (typeof window === "undefined") return defaultControls();

  return parseStoredControls(window.localStorage.getItem(STORAGE_KEY)) ?? defaultControls();
}

export function parseStoredControls(raw: string | null): AnalyticsControlsState | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AnalyticsControlsState>;
    if (
      typeof parsed.startDate !== "string" ||
      typeof parsed.endDate !== "string" ||
      (parsed.granularity !== "daily" && parsed.granularity !== "weekly" && parsed.granularity !== "monthly") ||
      typeof parsed.comparisonEnabled !== "boolean" ||
      typeof parsed.presetKey !== "string"
    ) {
      return null;
    }

    const clamped = clampAnalyticsRange({
      startDate: parsed.startDate,
      endDate: parsed.endDate,
    });

    const presetKey = (["1m", "2m", "3m", "6m", "1y", "2y", "custom"] as const)
      .includes(parsed.presetKey as AnalyticsPresetKey)
      ? (parsed.presetKey as AnalyticsPresetKey)
      : "custom";

    return {
      startDate: clamped.startDate,
      endDate: clamped.endDate,
      granularity: parsed.granularity,
      comparisonEnabled: parsed.comparisonEnabled,
      presetKey,
    };
  } catch {
    return null;
  }
}

export function useAnalyticsControls() {
  const [controls, setControls] = useState<AnalyticsControlsState>(() => initialControls());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(controls));
  }, [controls]);

  const api = useMemo(() => {
    function setPreset(preset: AnalyticsPresetKey) {
      if (preset === "custom") {
        setControls((prev) => ({
          ...prev,
          presetKey: "custom",
        }));
        return;
      }

      const endDate = controls.endDate;
      const startDate = format(
        subDays(new Date(`${endDate}T00:00:00`), PRESET_DAYS[preset] - 1),
        "yyyy-MM-dd",
      );
      const clamped = clampAnalyticsRange({ startDate, endDate });

      setControls((prev) => ({
        ...prev,
        startDate: clamped.startDate,
        endDate: clamped.endDate,
        presetKey: preset,
      }));
    }

    function setCustomRange(startDate: string, endDate: string) {
      const clamped = clampAnalyticsRange({ startDate, endDate });
      setControls((prev) => ({
        ...prev,
        startDate: clamped.startDate,
        endDate: clamped.endDate,
        presetKey: "custom",
      }));
    }

    function setGranularity(granularity: AnalyticsGranularity) {
      setControls((prev) => ({ ...prev, granularity }));
    }

    function setComparisonEnabled(comparisonEnabled: boolean) {
      setControls((prev) => ({ ...prev, comparisonEnabled }));
    }

    return {
      controls,
      setPreset,
      setCustomRange,
      setGranularity,
      setComparisonEnabled,
      reset: () => setControls(defaultControls()),
      presets: Object.keys(PRESET_DAYS) as Array<Exclude<AnalyticsPresetKey, "custom">>,
    };
  }, [controls]);

  return api;
}
