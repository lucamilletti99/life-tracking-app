import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/004_atomic_habits_differentiators.sql",
);

describe("atomic habits differentiators migration", () => {
  it("creates habit_stacks table", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("create table if not exists habit_stacks");
    expect(sql).toContain("preceding_habit_id uuid not null references habits(id) on delete cascade");
    expect(sql).toContain("following_habit_id uuid not null references habits(id) on delete cascade");
  });

  it("creates weekly_reviews table", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("create table if not exists weekly_reviews");
    expect(sql).toContain("week_start date not null");
    expect(sql).toContain("overall_score int");
    expect(sql).toContain("check (overall_score between 1 and 10)");
  });
});
