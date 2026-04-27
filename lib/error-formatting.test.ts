import { describe, expect, it } from "vitest";

import { formatErrorDetails, normalizeError } from "./error-formatting";

describe("error formatting", () => {
  it("uses toJSON details from Supabase-style errors", () => {
    const error = {
      toJSON() {
        return {
          name: "PostgrestError",
          message: 'column "target_direction" does not exist',
          code: "42703",
          details: null,
          hint: null,
        };
      },
    };

    expect(formatErrorDetails(error)).toMatchObject({
      name: "PostgrestError",
      message: 'column "target_direction" does not exist',
      code: "42703",
    });
  });

  it("normalizes plain Supabase error objects into real Error instances", () => {
    const normalized = normalizeError({
      name: "PostgrestError",
      message: 'column "target_direction" does not exist',
      code: "42703",
    });

    expect(normalized).toBeInstanceOf(Error);
    expect(normalized.name).toBe("PostgrestError");
    expect(normalized.message).toBe('column "target_direction" does not exist');
  });
});
