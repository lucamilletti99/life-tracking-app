import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { Goal } from "@/lib/types";

import { HabitForm } from "./HabitForm";

function goal(overrides: Partial<Goal>): Goal {
  return {
    id: "goal-1",
    title: "Get to 185 Lbs",
    goal_type: "target",
    unit: "lbs",
    target_value: 185,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    is_active: true,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("HabitForm", () => {
  it("shows essentials first: name, tracking, target, recurrence", () => {
    const html = renderToStaticMarkup(<HabitForm onCancel={() => {}} />);

    const nameIndex = html.indexOf("Habit name");
    const trackingIndex = html.indexOf("How to track it");
    const targetIndex = html.indexOf("Target");
    const recurrenceIndex = html.indexOf("Recurrence");

    expect(nameIndex).toBeGreaterThanOrEqual(0);
    expect(trackingIndex).toBeGreaterThan(nameIndex);
    expect(targetIndex).toBeGreaterThan(trackingIndex);
    expect(recurrenceIndex).toBeGreaterThan(targetIndex);
  });

  it("renders compact target controls with rule + value + unit, not separate rows", () => {
    const html = renderToStaticMarkup(<HabitForm onCancel={() => {}} />);

    expect(html).toContain("Target");
    expect(html).toContain("At least");
    expect(html).toContain("At most");
    expect(html).toContain("placeholder=\"Value\"");
    expect(html).toContain("placeholder=\"Unit\"");

    expect(html).not.toContain("Completion rule");
    expect(html).not.toContain("Target value");
  });

  it("keeps linked goals collapsed by default with summary visible", () => {
    const html = renderToStaticMarkup(
      <HabitForm
        onCancel={() => {}}
        goals={[
          goal({ id: "goal-1", title: "Get to 185 Lbs" }),
          goal({ id: "goal-2", title: "Have More Supportive Hobbies", goal_type: "accumulation" }),
        ]}
        initialLinkedGoalIds={["goal-1"]}
      />,
    );

    expect(html).toContain("Linked goal");
    expect(html).toContain("Linked: Get to 185 Lbs");
    expect(html).not.toContain("Have More Supportive Hobbies");
  });
});
