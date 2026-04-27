import { describe, expect, it } from "vitest";

import type { HabitTargetDirection, LogEntry, RecurrenceConfig, RecurrenceType, TrackingType } from "./types";
import { computeStreak } from "./streak";

function habitLog(
  date: string,
  overrides?: Partial<LogEntry>,
): LogEntry {
  return {
    id: `l-${date}-${Math.random()}`,
    entry_date: date,
    entry_datetime: `${date}T08:00:00Z`,
    source_type: "habit",
    source_id: "habit-1",
    numeric_value: 1,
    unit: "count",
    note: undefined,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function run(
  recurrenceType: RecurrenceType,
  recurrenceConfig: RecurrenceConfig,
  logs: LogEntry[],
  today: string,
  evaluation?: {
    trackingType?: TrackingType;
    defaultTargetValue?: number;
    targetDirection?: HabitTargetDirection;
  },
) {
  return computeStreak("habit-1", recurrenceType, recurrenceConfig, logs, today, evaluation);
}

describe("computeStreak", () => {
  it("computes daily streak current and best", () => {
    const result = run(
      "daily",
      {},
      [habitLog("2026-04-18"), habitLog("2026-04-19"), habitLog("2026-04-20")],
      "2026-04-20",
    );

    expect(result.current).toBe(3);
    expect(result.best).toBe(3);
    expect(result.lastCompletedDate).toBe("2026-04-20");
    expect(result.missedYesterday).toBe(false);
    expect(result.neverMissedTwice).toBe(true);
  });

  it("counts weekday streak across weekend gaps", () => {
    const result = run(
      "weekdays",
      { weekdays: [1, 2, 3, 4, 5] },
      [habitLog("2026-04-16"), habitLog("2026-04-17"), habitLog("2026-04-20")],
      "2026-04-20",
    );

    expect(result.current).toBe(3);
    expect(result.best).toBe(3);
  });

  it("keeps streak when today is still pending", () => {
    const result = run(
      "daily",
      {},
      [habitLog("2026-04-18"), habitLog("2026-04-19")],
      "2026-04-20",
    );

    expect(result.current).toBe(2);
    expect(result.best).toBe(2);
    expect(result.lastCompletedDate).toBe("2026-04-19");
  });

  it("tracks weekly quota streak for times_per_week", () => {
    const result = run(
      "times_per_week",
      { times_per_period: 3 },
      [
        habitLog("2026-04-06"),
        habitLog("2026-04-08"),
        habitLog("2026-04-10"),
        habitLog("2026-04-13"),
        habitLog("2026-04-15"),
        habitLog("2026-04-18"),
        habitLog("2026-04-20"),
      ],
      "2026-04-23",
    );

    expect(result.current).toBe(2);
    expect(result.best).toBe(2);
    expect(result.lastCompletedDate).toBe("2026-04-20");
  });

  it("sets missedYesterday and neverMissedTwice when misses stack", () => {
    const result = run(
      "daily",
      {},
      [habitLog("2026-04-17"), habitLog("2026-04-21")],
      "2026-04-21",
    );

    expect(result.current).toBe(1);
    expect(result.missedYesterday).toBe(true);
    expect(result.neverMissedTwice).toBe(false);
  });

  it("treats failed threshold logs as misses for streak counting", () => {
    const result = run(
      "daily",
      {},
      [habitLog("2026-04-20", { numeric_value: 700 })],
      "2026-04-20",
      {
        trackingType: "measurement",
        defaultTargetValue: 500,
        targetDirection: "at_most",
      },
    );

    expect(result.current).toBe(0);
    expect(result.best).toBe(0);
    expect(result.lastCompletedDate).toBeNull();
  });
});
