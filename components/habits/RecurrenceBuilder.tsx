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
    <div className="flex flex-col gap-3">
      <Label>Recurrence</Label>

      <div className="flex flex-wrap gap-2">
        {(
          ["daily", "weekdays", "times_per_week", "times_per_month", "day_of_month"] as RecurrenceType[]
        ).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTypeChange(t)}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
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
        <div className="flex gap-1">
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
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={type === "times_per_week" ? 7 : 31}
            value={config.times_per_period ?? 3}
            onChange={(e) =>
              onConfigChange({
                ...config,
                times_per_period: parseInt(e.target.value, 10),
              })
            }
            className="w-20"
          />
          <span className="text-sm text-neutral-500">
            times per {type === "times_per_week" ? "week" : "month"}
          </span>
        </div>
      )}

      {type === "day_of_month" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Day</span>
          <Input
            type="number"
            min={1}
            max={31}
            value={config.day_of_month ?? 1}
            onChange={(e) =>
              onConfigChange({
                ...config,
                day_of_month: parseInt(e.target.value, 10),
              })
            }
            className="w-20"
          />
          <span className="text-sm text-neutral-500">of each month</span>
        </div>
      )}
    </div>
  );
}
