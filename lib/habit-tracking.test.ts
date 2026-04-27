import { describe, expect, it } from "vitest";

import { toTrackingMode } from "./habit-tracking";

describe("toTrackingMode", () => {
  it("preserves boolean and duration tracking types", () => {
    expect(toTrackingMode("boolean")).toBe("boolean");
    expect(toTrackingMode("duration")).toBe("duration");
    expect(toTrackingMode("measurement")).toBe("measurement");
  });

  it("maps legacy numeric and amount types to measurement", () => {
    expect(toTrackingMode("numeric")).toBe("measurement");
    expect(toTrackingMode("amount")).toBe("measurement");
  });
});
