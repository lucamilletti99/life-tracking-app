import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { CalendarItem } from "@/lib/types";

import { DayView } from "./DayView";

const item: CalendarItem = {
  id: "todo-1",
  title: "Deep work block",
  start_datetime: "2026-04-22T09:00:00",
  end_datetime: "2026-04-22T10:30:00",
  all_day: false,
  kind: "todo",
  status: "pending",
  requires_numeric_log: false,
  source_habit_id: undefined,
  linked_goal_ids: [],
};

describe("DayView", () => {
  it("renders a labeled day agenda surface", () => {
    const html = renderToStaticMarkup(
      <DayView
        date={new Date("2026-04-22T12:00:00")}
        items={[item]}
        onItemClick={() => {}}
        onQuickComplete={() => {}}
      />,
    );

    expect(html).toContain('aria-label="Day agenda"');
    expect(html).toContain("Quick complete");
  });
});
