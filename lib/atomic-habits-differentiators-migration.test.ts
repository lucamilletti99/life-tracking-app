import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const authPath = resolve(
  process.cwd(),
  "supabase/sql/auth_rls.sql",
);
const dropPath = resolve(process.cwd(), "supabase/sql/drop_all_tables.sql");

describe("database auth and reset scripts", () => {
  it("drops all app tables for a clean reset", () => {
    const sql = readFileSync(dropPath, "utf8");

    expect(sql).toContain("drop table if exists");
    expect(sql).toContain("habit_stacks");
    expect(sql).toContain("weekly_reviews");
    expect(sql).toContain("log_entries");
    expect(sql).toContain("goals");
  });

  it("enables RLS and policies for differentiator tables", () => {
    const sql = readFileSync(authPath, "utf8");

    expect(sql).toContain("alter table habit_stacks enable row level security");
    expect(sql).toContain("alter table weekly_reviews enable row level security");
    expect(sql).toContain("create policy \"habit_stacks_owner_access\"");
    expect(sql).toContain("create policy \"weekly_reviews_owner_access\"");
  });
});
