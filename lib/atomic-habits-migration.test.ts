import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve(process.cwd(), "supabase/migrations/003_atomic_habits_foundation.sql");

describe("atomic habits foundation migration", () => {
  it("adds cue/identity/ease and pause fields to habits", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("alter table habits");
    expect(sql).toContain("add column if not exists cue_time time");
    expect(sql).toContain("add column if not exists cue_location text");
    expect(sql).toContain("add column if not exists cue_context text");
    expect(sql).toContain("add column if not exists implementation_intention text");
    expect(sql).toContain("add column if not exists minimum_version text");
    expect(sql).toContain("add column if not exists environment_setup text");
    expect(sql).toContain("add column if not exists identity_statement text");
    expect(sql).toContain("add column if not exists temptation_bundle text");
    expect(sql).toContain("add column if not exists is_paused boolean not null default false");
    expect(sql).toContain("add column if not exists paused_until date");
    expect(sql).toContain("add column if not exists difficulty_rating int");
    expect(sql).toContain("add column if not exists sort_order int not null default 0");
    expect(sql).toContain("add column if not exists category text");
    expect(sql).toContain("add column if not exists color_tag text");
  });

  it("adds completion metadata fields to log_entries", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("alter table log_entries");
    expect(sql).toContain("add column if not exists completion_photo_url text");
    expect(sql).toContain("add column if not exists mood_rating int");
    expect(sql).toContain("add column if not exists difficulty_felt int");
  });
});
