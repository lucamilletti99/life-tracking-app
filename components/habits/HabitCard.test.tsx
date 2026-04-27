import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HabitCard } from "./HabitCard";
import type { Habit } from "@/lib/types";

const habit: Habit = {
  id: "habit-1",
  title: "Read 30 pages",
  tracking_type: "boolean",
  recurrence_type: "daily",
  recurrence_config: {},
  auto_create_calendar_instances: true,
  is_active: true,
  is_paused: false,
  unit: undefined,
  cue_time: undefined,
  cue_context: undefined,
  cue_location: undefined,
  identity_statement: undefined,
  created_at: "",
  updated_at: "",
};

describe("HabitCard", () => {
  it("marks alertful cards with data-alert and keeps utility actions visible", () => {
    const html = renderToStaticMarkup(
      <HabitCard
        habit={habit}
        status="due"
        currentStreak={0}
        missedYesterday
        completionRate30d={62}
        linkedGoalTitles={["Read more books"]}
        onQuickComplete={() => {}}
        onTogglePause={() => {}}
      />,
    );

    expect(html).toContain('data-alert="true"');
    expect(html).toContain("Pause");
  });

  it("uses larger readability-oriented sizing for title, controls, and guidance text", () => {
    const html = renderToStaticMarkup(
      <HabitCard
        habit={habit}
        status="due"
        currentStreak={1}
        completionRate30d={40}
        linkedGoalTitles={["Read more books"]}
        heatmap={[
          { date: "2026-04-20", status: "none", value: undefined, unit: undefined },
          { date: "2026-04-21", status: "none", value: undefined, unit: undefined },
          { date: "2026-04-22", status: "complete", value: 1, unit: undefined },
          { date: "2026-04-23", status: "none", value: undefined, unit: undefined },
          { date: "2026-04-24", status: "none", value: undefined, unit: undefined },
          { date: "2026-04-25", status: "none", value: undefined, unit: undefined },
          { date: "2026-04-26", status: "none", value: undefined, unit: undefined },
        ]}
        onQuickComplete={() => {}}
        onTogglePause={() => {}}
        onLogDate={() => {}}
      />,
    );

    expect(html).toContain("text-[14.5px]");
    expect(html).toContain("h-7");
    expect(html).toContain("text-xs");
    expect(html).toContain("This week");
  });

  it("renders weekday initials inside each activity tile instead of a separate label row", () => {
    const html = renderToStaticMarkup(
      <HabitCard
        habit={habit}
        status="due"
        currentStreak={1}
        completionRate30d={40}
        linkedGoalTitles={["Read more books"]}
        heatmap={[
          { date: "2026-04-20", status: "none", value: undefined, unit: undefined },
          { date: "2026-04-21", status: "none", value: undefined, unit: undefined },
          { date: "2026-04-22", status: "complete", value: 1, unit: undefined },
          { date: "2026-04-23", status: "none", value: undefined, unit: undefined },
          { date: "2026-04-24", status: "none", value: undefined, unit: undefined },
          { date: "2026-04-25", status: "none", value: undefined, unit: undefined },
          { date: "2026-04-26", status: "none", value: undefined, unit: undefined },
        ]}
        onQuickComplete={() => {}}
        onTogglePause={() => {}}
        onLogDate={() => {}}
      />,
    );

    expect(html).toMatch(/<button[^>]*title="2026-04-20"[^>]*>\s*M\s*<\/button>/);
    expect(html).not.toContain("leading-none text-ink-subtle");
  });

  it("shows linked goal context and no explicit show/hide aria labels", () => {
    const html = renderToStaticMarkup(
      <HabitCard
        habit={habit}
        status="due"
        currentStreak={0}
        completionRate30d={12}
        linkedGoalTitles={["Get to 185 Lbs"]}
        onQuickComplete={() => {}}
        onTogglePause={() => {}}
      />,
    );

    expect(html).toContain("Get to 185 Lbs");
    expect(html).not.toContain("aria-label=\"Show details\"");
    expect(html).not.toContain("aria-label=\"Hide details\"");
  });

  it("renders the current single-column card layout classes", () => {
    const html = renderToStaticMarkup(
      <HabitCard
        habit={habit}
        status="due"
        currentStreak={0}
        completionRate30d={12}
        linkedGoalTitles={[]}
        onQuickComplete={() => {}}
        onTogglePause={() => {}}
      />,
    );

    expect(html).toContain("flex w-full flex-col");
    expect(html).toContain("rounded-2xl");
  });
});
