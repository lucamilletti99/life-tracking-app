import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const initPath = resolve(process.cwd(), "supabase/sql/init.sql");

describe("database init script", () => {
  it("defines habits with cue/identity/ease and pause fields", () => {
    const sql = readFileSync(initPath, "utf8");

    expect(sql).toContain("create table if not exists habits");
    expect(sql).toContain("cue_time time");
    expect(sql).toContain("cue_location text");
    expect(sql).toContain("cue_context text");
    expect(sql).toContain("implementation_intention text");
    expect(sql).toContain("minimum_version text");
    expect(sql).toContain("environment_setup text");
    expect(sql).toContain("identity_statement text");
    expect(sql).toContain("temptation_bundle text");
    expect(sql).toContain("unit text check (tracking_type <> 'measurement' or (unit is not null and btrim(unit) <> ''))");
    expect(sql).toContain("target_direction text not null default 'at_least' check (target_direction in ('at_least','at_most'))");
    expect(sql).toContain("is_paused boolean not null default false");
    expect(sql).toContain("paused_until date");
    expect(sql).toContain("difficulty_rating int");
    expect(sql).toContain("sort_order int not null default 0");
    expect(sql).toContain("category text");
    expect(sql).toContain("color_tag text");
  });

  it("defines log_entries with goal_ids and completion metadata", () => {
    const sql = readFileSync(initPath, "utf8");

    expect(sql).toContain("create table if not exists log_entries");
    expect(sql).toContain("goal_ids uuid[] not null default '{}'");
    expect(sql).toContain("completion_photo_url text");
    expect(sql).toContain("mood_rating int");
    expect(sql).toContain("difficulty_felt int");
  });

  it("defines differentiator tables in baseline schema", () => {
    const sql = readFileSync(initPath, "utf8");

    expect(sql).toContain("create table if not exists habit_stacks");
    expect(sql).toContain("preceding_habit_id uuid not null references habits(id) on delete cascade");
    expect(sql).toContain("following_habit_id uuid not null references habits(id) on delete cascade");
    expect(sql).toContain("create table if not exists weekly_reviews");
    expect(sql).toContain("week_start date not null");
    expect(sql).toContain("check (overall_score between 1 and 10)");
  });
});
