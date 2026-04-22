# Atomic Habits Behavior Engine Implementation PRD

## Scope Delivered

The implementation ships the behavior-engine layer across Habits, Today, Calendar, Goals, and Analytics:

- Streak and completion domain utilities with recurrence-aware logic.
- Today-first execution surface (`/today`) with quick complete/log actions.
- Friction-reduced calendar interactions and recovery prompts.
- Habit cue/identity metadata capture and execution-surface rendering.
- Per-habit and analytics heatmaps, weekly comparisons, and leaderboard views.
- Goal pace trajectory projection and contextual messaging.
- Differentiator schema for habit stacks and weekly reviews.
- Habit pause/resume controls.

## Acceptance Traceability

- Streak visible on every habit card: `components/habits/HabitCard.tsx`.
- `/today` supports one-click execution: `app/(app)/today/page.tsx`.
- Habits page shows live today status: `app/(app)/habits/page.tsx`.
- Calendar supports inline completion for boolean items: `components/calendar/CalendarItem.tsx`.
- Immediate completion feedback exists in Habits/Today/Calendar cards.
- Heatmap available per habit: `components/habits/HabitHeatmap.tsx`.
- Analytics includes leaderboard, weekly comparison, and day strength:
  - `components/analytics/HabitLeaderboard.tsx`
  - `components/analytics/WeeklyComparisonCard.tsx`
  - `components/analytics/DayStrengthCard.tsx`
- Goal detail includes pace projection messaging:
  - `components/goals/GoalTrajectoryChart.tsx`
  - `app/(app)/goals/[id]/page.tsx`
- Cue/identity fields persist and render:
  - `components/habits/HabitForm.tsx`
  - `components/habits/HabitCard.tsx`
  - `components/calendar/RightDrawer.tsx`
- Pause, weekly review, and stack sequencing are integrated:
  - `components/habits/HabitCard.tsx`
  - `components/analytics/WeeklyReviewPrompt.tsx`
  - `lib/habit-stack-insights.ts`

## QA Matrix

Manual scenarios to validate before production deploy:

1. Boolean habit quick complete from:
   - Habits page card action
   - Today page action
   - Calendar item quick action
2. Numeric habit quick log from Habits and Today modal flows.
3. Skip flow with `minimum_version` rescue prompt in Calendar drawer.
4. Never-miss-twice visual cue after a skipped prior day.
5. Pause a habit and confirm it does not appear in Today or Calendar generation.
6. Habit stack cue:
   - Complete precedent habit.
   - Confirm following habit is highlighted as "Stack up next" in Habits/Today and in drawer context.
7. Weekly review prompt appears on Sunday only when current week review does not exist.
8. Analytics empty state and dense state render without console/runtime errors.
9. Mobile viewport review for Today, Habits heatmap expansion, and Analytics cards.

## Migration and Backward Compatibility

- Apply migrations in order:
  1. `003_atomic_habits_foundation.sql`
  2. `004_atomic_habits_differentiators.sql`
- Existing data remains valid because new columns are nullable or defaulted.
- Optional differentiator data (stacks/reviews) is non-blocking for existing users.

## Rollout Strategy

1. Deploy database migrations.
2. Deploy application code with default-safe behavior (no stack/review hard dependency).
3. Monitor runtime errors, calendar/today action latency, and save failures.
4. After a 24-hour clean window, announce full Atomic Habits feature availability.
