import { describe, expect, it } from "vitest";

import { shouldShowWeeklyReviewPrompt } from "./weekly-review";
import type { WeeklyReview } from "./types";

function review(overrides: Partial<WeeklyReview>): WeeklyReview {
  return {
    id: "review-1",
    week_start: "2026-04-20",
    created_at: "",
    ...overrides,
  };
}

describe("shouldShowWeeklyReviewPrompt", () => {
  it("shows on Sunday when the week has no review", () => {
    const result = shouldShowWeeklyReviewPrompt({
      asOf: "2026-04-26", // Sunday
      weeklyReviews: [],
    });

    expect(result).toBe(true);
  });

  it("does not show on non-Sunday days", () => {
    const result = shouldShowWeeklyReviewPrompt({
      asOf: "2026-04-22", // Wednesday
      weeklyReviews: [],
    });

    expect(result).toBe(false);
  });

  it("does not show when this week is already reviewed", () => {
    const result = shouldShowWeeklyReviewPrompt({
      asOf: "2026-04-26",
      weeklyReviews: [review({ week_start: "2026-04-20" })],
    });

    expect(result).toBe(false);
  });
});
