# Atomic Habits Behavior Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the app from a tracking system into an Atomic Habits-aligned behavior-change system by shipping streaks, a daily execution surface, frictionless completion, richer cues/identity metadata, and progression analytics.

**Architecture:** Keep the existing `Goals -> Habits -> Logs` backbone, and add a behavior layer with pure domain utilities (`lib/streak.ts`, `lib/habit-insights.ts`, `lib/today-snapshot.ts`) that drive UI consistently across Habits, Today, Calendar, Goals, and Analytics. Introduce schema additions in a backward-compatible migration, then progressively expose the new metadata and insight surfaces in thin UI components backed by existing service patterns.

**Tech Stack:** Next.js App Router (v16), React 19, TypeScript, Supabase/Postgres, date-fns, Recharts, Tailwind, Vitest.

---

## Scope Check
The source analysis document contains multiple independent subsystems. Implementing all of them in one pass is high-risk. This plan decomposes delivery into four shippable phases:

1. **Phase A (Retention Core):** Streaks, habit status visibility, one-click completion, `/today` route.
2. **Phase B (Competitive Gap):** Heatmaps, analytics expansion, goal trajectory, cue/identity fields.
3. **Phase C (Differentiators):** Habit stacking, two-minute rule, weekly review flow, never-miss-twice nudges.
4. **Phase D (Polish + Hardening):** pause/resume habits, category/color system, rollout safeguards and regression sweep.

Each phase leaves the app in a fully testable, releasable state.

## File Structure

### New files
- `supabase/migrations/003_atomic_habits_foundation.sql`
- `supabase/migrations/004_atomic_habits_differentiators.sql`
- `lib/streak.ts`
- `lib/streak.test.ts`
- `lib/habit-insights.ts`
- `lib/habit-insights.test.ts`
- `lib/today-snapshot.ts`
- `lib/today-snapshot.test.ts`
- `components/habits/HabitStreakBadge.tsx`
- `components/habits/HabitStatusBadge.tsx`
- `components/habits/HabitHeatmap.tsx`
- `components/habits/HabitQuickActions.tsx`
- `components/today/TodayHeader.tsx`
- `components/today/TodayHabitList.tsx`
- `components/today/TodayGoalSnapshot.tsx`
- `components/analytics/HabitLeaderboard.tsx`
- `components/analytics/HabitCompletionTable.tsx`
- `components/analytics/CompletionHeatmapPanel.tsx`
- `components/analytics/WeeklyComparisonCard.tsx`
- `components/analytics/DayStrengthCard.tsx`
- `components/goals/GoalTrajectoryChart.tsx`
- `app/(app)/today/page.tsx`

### Modified files
- `lib/types.ts`
- `lib/services/habits.ts`
- `lib/services/logs.ts`
- `lib/services/todos.ts`
- `lib/services/goals.ts`
- `lib/habit-status.ts`
- `lib/analytics.ts`
- `lib/analytics.test.ts`
- `hooks/useCalendarWeek.ts`
- `components/habits/HabitForm.tsx`
- `components/habits/HabitCard.tsx`
- `components/calendar/CalendarItem.tsx`
- `components/calendar/RightDrawer.tsx`
- `components/calendar/DayView.tsx`
- `components/layout/Sidebar.tsx`
- `app/(app)/habits/page.tsx`
- `app/(app)/calendar/page.tsx`
- `app/(app)/analytics/page.tsx`
- `app/(app)/goals/[id]/page.tsx`

## Task 1: Add Data Model and Type Foundations

**Files:**
- Create: `supabase/migrations/003_atomic_habits_foundation.sql`
- Modify: `lib/types.ts`
- Modify: `lib/services/habits.ts`
- Modify: `lib/services/logs.ts`

- [ ] **Step 1: Write migration test checklist (manual SQL verification script)**
Run:
`supabase db reset && supabase db diff --use-migra`
Expected: migration applies cleanly and produces no drift after reset.

- [ ] **Step 2: Add foundation columns to `habits`**
Add nullable columns:
`cue_time`, `cue_location`, `cue_context`, `implementation_intention`, `minimum_version`, `environment_setup`, `identity_statement`, `temptation_bundle`, `is_paused`, `paused_until`, `difficulty_rating`, `sort_order`, `category`, `color_tag`.
Expected: no backfill needed; defaults keep current behavior.

- [ ] **Step 3: Add `log_entries` optional enrichment columns**
Add:
`completion_photo_url`, `mood_rating`, `difficulty_felt`.
Expected: existing inserts continue to work without payload changes.

- [ ] **Step 4: Update TypeScript interfaces and service payload typing**
Extend `Habit` and `LogEntry` in `lib/types.ts`, and ensure create/update service calls accept these optional fields.

- [ ] **Step 5: Verify baseline suite after schema/type expansion**
Run:
`npm run lint && npm run test`
Expected: PASS.

- [ ] **Step 6: Commit**
`git commit -am "feat: add atomic habits foundation schema and types"`

## Task 2: Build Streak and Habit Insight Domain Layer (Core Retention)

**Files:**
- Create: `lib/streak.ts`
- Create: `lib/streak.test.ts`
- Create: `lib/habit-insights.ts`
- Create: `lib/habit-insights.test.ts`
- Modify: `lib/habit-status.ts`

- [ ] **Step 1: Write failing streak tests for recurrence-aware behavior**
Cover:
- daily streak continuation
- weekdays streak handling over weekends
- times-per-week streak continuity per week
- best streak tracking
- never-miss-twice boolean.

Run:
`npm run test -- lib/streak.test.ts`
Expected: FAIL module not found.

- [ ] **Step 2: Implement `computeStreak(...)` and `computeHabitCompletionRate(...)`**
Return shape:
`{ current, best, lastCompletedDate, missedYesterday, neverMissedTwice }`
plus 7d/30d/90d completion rates.

- [ ] **Step 3: Add a stable completion classifier shared by calendar and streak logic**
Unify skip/complete parsing in `lib/habit-status.ts` so status derivation is single-source.

- [ ] **Step 4: Add failing tests for per-habit daily matrix and quota progress**
`lib/habit-insights.test.ts` covers:
- 12-week heatmap cell generation
- remaining completions for `times_per_week`
- due-today vs optional-today states.

- [ ] **Step 5: Run domain tests**
Run:
`npm run test -- lib/streak.test.ts lib/habit-insights.test.ts lib/habit-status.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**
`git add lib/streak.ts lib/streak.test.ts lib/habit-insights.ts lib/habit-insights.test.ts lib/habit-status.ts`
`git commit -m "feat: add streak and habit insight computation layer"`

## Task 3: Hydrate Calendar and Habits with Linked Goal + Status Context

**Files:**
- Modify: `hooks/useCalendarWeek.ts`
- Modify: `lib/services/habits.ts`
- Modify: `lib/services/goals.ts`
- Modify: `lib/types.ts`

- [ ] **Step 1: Add failing hook-level test for linked goal IDs and status mapping**
If hook tests are not present, add a pure mapper test in `lib/habit-insights.test.ts` to validate item enrichment contract.

- [ ] **Step 2: Enrich generated `CalendarItem` with linked goal IDs and optional streak metadata**
Fetch goal links once per load, map by habit/todo, and attach to calendar items.

- [ ] **Step 3: Ensure paused habits do not auto-generate occurrences**
Filter where `is_paused = false` (or `paused_until < today`).

- [ ] **Step 4: Verify calendar load remains performant**
Run:
`npm run test -- hooks/useCalendarWeek.ts` (if exists) or `npm run test -- lib/habit-insights.test.ts`
Expected: PASS and no extra N+1 calls in review.

- [ ] **Step 5: Commit**
`git commit -am "feat: enrich calendar items with goal links and pause-aware status"`

## Task 4: Redesign Habit Cards for Daily Execution State

**Files:**
- Create: `components/habits/HabitStreakBadge.tsx`
- Create: `components/habits/HabitStatusBadge.tsx`
- Create: `components/habits/HabitQuickActions.tsx`
- Modify: `components/habits/HabitCard.tsx`
- Modify: `app/(app)/habits/page.tsx`

- [ ] **Step 1: Define card data contract in page container**
Compute per-habit:
- today status (`done`, `pending`, `skipped`, `paused`)
- current/best streak
- 30d completion rate
- linked goals summary.

- [ ] **Step 2: Add one-tap completion for boolean habits**
Add inline check action with optimistic update + rollback on error.

- [ ] **Step 3: Add quick log action for numeric habits**
Use existing `LogForm` pattern in compact modal/sheet.

- [ ] **Step 4: Add motion for completion feedback**
Animate check state and streak bump on completion.

- [ ] **Step 5: Verify UX behavior**
Manual checks:
- morning state differs from evening state
- status updates after quick actions without full reload.

- [ ] **Step 6: Commit**
`git commit -am "feat: upgrade habit cards with live status streaks and quick actions"`

## Task 5: Build `/today` as Primary Daily Execution Surface

**Files:**
- Create: `app/(app)/today/page.tsx`
- Create: `lib/today-snapshot.ts`
- Create: `lib/today-snapshot.test.ts`
- Create: `components/today/TodayHeader.tsx`
- Create: `components/today/TodayHabitList.tsx`
- Create: `components/today/TodayGoalSnapshot.tsx`
- Modify: `components/layout/Sidebar.tsx`

- [ ] **Step 1: Write failing snapshot tests for today composition**
Cover:
- items due today
- overdue carryover (optional section)
- grouped by morning/afternoon/evening/anytime
- quick wins ordering.

Run:
`npm run test -- lib/today-snapshot.test.ts`
Expected: FAIL module not found.

- [ ] **Step 2: Implement today snapshot builder**
Produce one payload for all Today widgets from habits/todos/logs/goals.

- [ ] **Step 3: Implement Today page and set navigation prominence**
Add `Today` to sidebar and set `/today` as first nav destination.

- [ ] **Step 4: Wire quick actions from Today list**
Complete/log/skip without leaving page.

- [ ] **Step 5: Validate daily flow**
Run:
`npm run test -- lib/today-snapshot.test.ts`
Expected: PASS.

Manual:
- open app -> Today page usable with one-click actions.

- [ ] **Step 6: Commit**
`git add app/(app)/today/page.tsx components/today/* lib/today-snapshot* components/layout/Sidebar.tsx`
`git commit -m "feat: add today dashboard with one-click habit execution"`

## Task 6: Reduce Execution Friction in Calendar and Drawer

**Files:**
- Modify: `components/calendar/CalendarItem.tsx`
- Modify: `components/calendar/DayView.tsx`
- Modify: `components/calendar/RightDrawer.tsx`
- Modify: `app/(app)/calendar/page.tsx`

- [ ] **Step 1: Add inline quick-complete control on calendar chips**
For boolean items, complete directly from chip/list row.

- [ ] **Step 2: Add “Never miss twice” cue styling**
Highlight today item when yesterday was skipped.

- [ ] **Step 3: Surface minimum-version rescue prompt**
If user skips and habit has `minimum_version`, show lightweight prompt first.

- [ ] **Step 4: Show linked goal context in drawer**
Include goal chips + live progress indicator.

- [ ] **Step 5: Verify interaction count reduction**
Before/after checklist:
- boolean completion from 4+ interactions -> 1 interaction.

- [ ] **Step 6: Commit**
`git commit -am "feat: add low-friction calendar completion and rescue prompts"`

## Task 7: Add Per-Habit Heatmap and Performance Summary

**Files:**
- Create: `components/habits/HabitHeatmap.tsx`
- Modify: `app/(app)/habits/page.tsx`
- Modify: `lib/habit-insights.ts`
- Modify: `lib/habit-insights.test.ts`

- [ ] **Step 1: Add failing test for 12-week heatmap cell generation**
Verify stable 84-day matrix and intensity bands.

- [ ] **Step 2: Implement heatmap computation and rendering component**
Include tooltip with date + status + logged value.

- [ ] **Step 3: Add expand/collapse habit detail section**
Show streak, completion rate, and heatmap per habit.

- [ ] **Step 4: Verify visual integrity on desktop/mobile**
Manual: no overflow in narrow sidebar and small screens.

- [ ] **Step 5: Commit**
`git commit -am "feat: add per-habit 12-week completion heatmaps"`

## Task 8: Expand Analytics to Behavior Insights

**Files:**
- Create: `components/analytics/HabitLeaderboard.tsx`
- Create: `components/analytics/HabitCompletionTable.tsx`
- Create: `components/analytics/CompletionHeatmapPanel.tsx`
- Create: `components/analytics/WeeklyComparisonCard.tsx`
- Create: `components/analytics/DayStrengthCard.tsx`
- Modify: `lib/analytics.ts`
- Modify: `lib/analytics.test.ts`
- Modify: `app/(app)/analytics/page.tsx`

- [ ] **Step 1: Add failing analytics tests for new payload sections**
Add coverage for:
- weekly vs previous-week delta
- streak leaderboard ordering
- best/worst weekday determination.

- [ ] **Step 2: Extend `buildAnalyticsSnapshot`**
Return:
`habitStats`, `streakLeaderboard`, `weeklyComparison`, `dayStrength`, `habitHeatmapData`.

- [ ] **Step 3: Render new analytics panels in stable order**
Keep existing totals + chart; append richer behavior cards below.

- [ ] **Step 4: Verify analytics with sparse and dense data**
Run:
`npm run test -- lib/analytics.test.ts`
Expected: PASS for empty-state and populated fixtures.

- [ ] **Step 5: Commit**
`git commit -am "feat: expand analytics with streaks heatmaps and weekly comparisons"`

## Task 9: Goal Trajectory + Plateau of Latent Potential Messaging

**Files:**
- Create: `components/goals/GoalTrajectoryChart.tsx`
- Modify: `app/(app)/goals/[id]/page.tsx`
- Modify: `lib/goal-calculations.ts`
- Modify: `lib/goal-calculations.test.ts`

- [ ] **Step 1: Add failing tests for pace projection**
Cases:
- on-track accumulation
- behind but improving
- limit-goal overspend warning.

- [ ] **Step 2: Implement trajectory projection utility**
Return projected completion date and pace delta.

- [ ] **Step 3: Surface contextual messaging on goal detail**
Examples:
- “Compounding in progress” (behind pace but trend improving)
- “At current pace, target date: …”.

- [ ] **Step 4: Verify regression safety for existing progress bars**
Run:
`npm run test -- lib/goal-calculations.test.ts`
Expected: PASS with existing + new tests.

- [ ] **Step 5: Commit**
`git commit -am "feat: add goal trajectory projections and latent-potential messaging"`

## Task 10: Add Identity/Cue Inputs to Habit Authoring and Surfacing

**Files:**
- Modify: `components/habits/HabitForm.tsx`
- Modify: `components/habits/HabitCard.tsx`
- Modify: `components/calendar/RightDrawer.tsx`
- Modify: `lib/services/habits.ts`

- [ ] **Step 1: Extend form UI with optional cue/identity fields**
Add:
- cue time/location/context
- implementation intention
- identity statement
- temptation bundle
- environment setup.

- [ ] **Step 2: Surface these fields where execution happens**
Show concise tags or secondary text on habit card and drawer.

- [ ] **Step 3: Ensure create/update services persist all optional fields**
Verify no payload stripping in auto-save flow.

- [ ] **Step 4: Manual verification**
Create/edit habit with all fields; refresh; confirm persistence and rendering.

- [ ] **Step 5: Commit**
`git commit -am "feat: add cue and identity capture to habit workflow"`

## Task 11: Differentiator Layer (Stacks, Weekly Reviews, Pause)

**Files:**
- Create: `supabase/migrations/004_atomic_habits_differentiators.sql`
- Modify: `lib/types.ts`
- Modify: `lib/services/habits.ts`
- Modify: `app/(app)/habits/page.tsx`
- Modify: `app/(app)/analytics/page.tsx`
- Modify: `components/calendar/RightDrawer.tsx`

- [ ] **Step 1: Add tables for `habit_stacks` and `weekly_reviews`**
Keep relations user-scoped and cascade-safe.

- [ ] **Step 2: Implement pause/resume flow**
UI control on habit card and detail sheet; paused habits hidden from today/calendar generation.

- [ ] **Step 3: Add stack sequencing display**
After completion of precedent habit, highlight next habit in sequence.

- [ ] **Step 4: Add weekly review prompt and persistence**
Sunday prompt + simple reflection form saved to `weekly_reviews`.

- [ ] **Step 5: Verify backward compatibility**
Run:
`npm run lint && npm run test`
Expected: PASS with no runtime dependency on optional differentiator data.

- [ ] **Step 6: Commit**
`git commit -am "feat: add habit stacks weekly review and pause controls"`

## Task 12: Hardening, QA Matrix, and Release Rollout

**Files:**
- Modify: `README.md` (if needed for new flows)
- Modify: `docs/implementation-prd.md` (acceptance traceability)

- [ ] **Step 1: Run full quality gates**
Run:
`npm run lint`
`npm run test`
`npm run build`
Expected: PASS for all.

- [ ] **Step 2: Execute manual QA matrix**
Scenarios:
- boolean quick complete (Habits, Today, Calendar)
- numeric quick log and completion status sync
- streak edge cases around skipped day and recovery
- today dashboard empty-state and dense-state
- analytics empty-state with zero habits/logs
- mobile viewport checks for new panels.

- [ ] **Step 3: Validate DB migration safety**
Smoke test new user and existing user on same branch against fresh reset and existing dataset.

- [ ] **Step 4: Rollout strategy**
Enable in this order:
1. deploy migrations
2. deploy code with conservative defaults
3. monitor errors and status latency
4. announce feature set after 24h clean window.

- [ ] **Step 5: Final commit**
`git add -A && git commit -m "chore: complete atomic habits behavior engine rollout"`

---

## Verification Checklist (Definition of Done)
- [ ] Streak visible on every habit card.
- [ ] `/today` exists and supports one-click execution.
- [ ] Habits page shows real-time today status.
- [ ] Calendar supports inline completion for boolean items.
- [ ] Completion interaction includes immediate visual feedback.
- [ ] Heatmap available per habit.
- [ ] Analytics includes streak leaderboard, weekly comparison, best/worst day.
- [ ] Goal detail includes pace projection + latent-potential messaging.
- [ ] Cue/identity fields persist and render in execution surfaces.
- [ ] Pause habit, weekly review, and stacking flows function without regressions.

## Delivery Order Recommendation
1. Tasks 1-6 (ship as Release 1).
2. Tasks 7-10 (ship as Release 2).
3. Tasks 11-12 (ship as Release 3).

This keeps retention-critical value in users’ hands quickly, while preserving room to add differentiators without destabilizing core execution UX.
