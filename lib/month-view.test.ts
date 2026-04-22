import { describe, expect, it } from "vitest";

import type { CalendarItem } from "./types";
import { buildMonthGrid } from "./month-view";

const baseItem = {
  all_day: false,
  status: "pending" as const,
  source_habit_id: undefined,
  requires_numeric_log: false,
  linked_goal_ids: [],
};

describe("buildMonthGrid", () => {
  it("builds a Monday-start 5-week grid for April 2026", () => {
    const weeks = buildMonthGrid(new Date("2026-04-15T12:00:00"), []);

    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toHaveLength(7);
    expect(weeks[0][0].date).toBe("2026-03-30");
    expect(weeks[4][6].date).toBe("2026-05-03");
  });

  it("supports months that span 6 calendar rows", () => {
    const weeks = buildMonthGrid(new Date("2026-08-12T12:00:00"), []);

    expect(weeks).toHaveLength(6);
    expect(weeks[0][0].date).toBe("2026-07-27");
    expect(weeks[5][6].date).toBe("2026-09-06");
  });

  it("maps and sorts items by day", () => {
    const items: CalendarItem[] = [
      {
        ...baseItem,
        id: "i2",
        kind: "todo",
        title: "Later",
        start_datetime: "2026-04-10T18:00:00",
        end_datetime: "2026-04-10T19:00:00",
      },
      {
        ...baseItem,
        id: "i1",
        kind: "habit_occurrence",
        title: "Earlier",
        start_datetime: "2026-04-10T08:00:00",
        end_datetime: "2026-04-10T08:30:00",
      },
    ];

    const weeks = buildMonthGrid(new Date("2026-04-15T12:00:00"), items);
    const day = weeks.flat().find((cell) => cell.date === "2026-04-10");

    expect(day).toBeDefined();
    expect(day?.items.map((item) => item.id)).toEqual(["i1", "i2"]);
    expect(day?.isCurrentMonth).toBe(true);
  });
});
