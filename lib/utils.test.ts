import { describe, expect, it } from "vitest";
import { getDayLoad } from "./utils";
import type { CalendarItem } from "./types";

function makeItem(date: string, hour: number): CalendarItem {
  return {
    id: `item-${date}-${hour}`,
    title: "Test",
    start_datetime: `${date}T0${hour}:00:00`,
    end_datetime: `${date}T0${hour}:30:00`,
    all_day: false,
    kind: "todo",
    status: "pending",
    requires_numeric_log: false,
    linked_goal_ids: [],
  };
}

const date = new Date("2026-04-20T00:00:00");

describe("getDayLoad", () => {
  it("returns 'empty' when there are no items", () => {
    expect(getDayLoad([], date)).toBe("empty");
  });

  it("returns 'light' for 1 item", () => {
    expect(getDayLoad([makeItem("2026-04-20", 9)], date)).toBe("light");
  });

  it("returns 'light' for 2 items", () => {
    const items = [makeItem("2026-04-20", 9), makeItem("2026-04-20", 10)];
    expect(getDayLoad(items, date)).toBe("light");
  });

  it("returns 'moderate' for 3 items", () => {
    const items = [1, 2, 3].map((h) => makeItem("2026-04-20", h));
    expect(getDayLoad(items, date)).toBe("moderate");
  });

  it("returns 'moderate' for 4 items", () => {
    const items = [1, 2, 3, 4].map((h) => makeItem("2026-04-20", h));
    expect(getDayLoad(items, date)).toBe("moderate");
  });

  it("returns 'busy' for 5+ items", () => {
    const items = [1, 2, 3, 4, 5].map((h) => makeItem("2026-04-20", h));
    expect(getDayLoad(items, date)).toBe("busy");
  });

  it("ignores all-day items", () => {
    const allDay: CalendarItem = { ...makeItem("2026-04-20", 0), all_day: true };
    expect(getDayLoad([allDay, allDay, allDay, allDay, allDay], date)).toBe("empty");
  });

  it("ignores items on other dates", () => {
    const other = makeItem("2026-04-21", 9);
    expect(getDayLoad([other, other, other, other, other], date)).toBe("empty");
  });
});
