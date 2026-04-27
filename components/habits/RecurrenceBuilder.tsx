"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RecurrenceConfig, RecurrenceType } from "@/lib/types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface RecurrenceBuilderProps {
  type: RecurrenceType;
  config: RecurrenceConfig;
  onTypeChange: (t: RecurrenceType) => void;
  onConfigChange: (c: RecurrenceConfig) => void;
}

export function RecurrenceBuilder({
  type,
  config,
  onTypeChange,
  onConfigChange,
}: RecurrenceBuilderProps) {
  return (
    <div className="flex flex-col gap-4">
      <Label>Recurrence</Label>

      <div className="mt-0.5 flex flex-nowrap gap-2 overflow-x-auto pb-1">
        {(
          ["daily", "weekdays", "times_per_week", "times_per_month", "day_of_month"] as RecurrenceType[]
        ).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTypeChange(t)}
            className={`inline-flex h-8 shrink-0 items-center rounded-lg border px-3 text-xs whitespace-nowrap transition-colors ${
              type === t
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
            }`}
          >
            {t === "daily"
              ? "Every day"
              : t === "weekdays"
                ? "Select days"
                : t === "times_per_week"
                  ? "X/week"
                  : t === "times_per_month"
                    ? "X/month"
                    : "Day of month"}
          </button>
        ))}
      </div>

      {type === "weekdays" && (
        <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1">
          {WEEKDAY_LABELS.map((label, i) => {
            const active = config.weekdays?.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() =>
                  onConfigChange({
                    ...config,
                    weekdays: active
                      ? (config.weekdays ?? []).filter((d) => d !== i)
                      : [...(config.weekdays ?? []), i],
                  })
                }
                className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {(type === "times_per_week" || type === "times_per_month") && (
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={1}
            max={type === "times_per_week" ? 7 : 31}
            value={config.times_per_period ?? 3}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              if (!Number.isFinite(parsed) || parsed < 1) return;
              onConfigChange({ ...config, times_per_period: parsed });
            }}
            className="w-24"
          />
          <span className="text-sm text-neutral-500">
            times per {type === "times_per_week" ? "week" : "month"}
          </span>
        </div>
      )}

      {type === "day_of_month" && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">Day</span>
          <Input
            type="number"
            min={1}
            max={31}
            value={config.day_of_month ?? 1}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              if (!Number.isFinite(parsed) || parsed < 1) return;
              onConfigChange({ ...config, day_of_month: parsed });
            }}
            className="w-24"
          />
          <span className="text-sm text-neutral-500">of each month</span>
        </div>
      )}
    </div>
  );
}
