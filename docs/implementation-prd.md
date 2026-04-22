# Implementation PRD — Habit Behavior Engine
*Life Tracking App · April 2026*

---

## Overview

This PRD covers the next phase of development: transforming the app from a tracking system into a behavior change system grounded in Atomic Habits. Features are organized into three tiers by priority.

The core thesis: the data model and calendar-first architecture are already sound. What's missing is the **feedback and motivation layer** — streaks, daily execution surface, live status, and identity framing.

---

## Tier 1 — Ship First

These are the highest-retention, lowest-effort changes. Each one has a clear scope and can be shipped independently.

---

### 1. Streak Engine

**What:** Compute and display current and best streaks per habit.

**Why:** The single most impactful missing feature. Every successful habit app is built around streaks. Atomic Habits' "never miss twice" rule depends on users *seeing* their streak.

**Scope:**

Create `lib/streak.ts` with a pure function that takes a habit's recurrence config and an array of log entries, and returns:

```ts
interface StreakResult {
  current: number;       // days/occurrences in a row right now
  best: number;          // all-time best streak
  lastCompleted: string | null;  // ISO date
  missedYesterday: boolean;      // true if last required occurrence was skipped
}
```

The function should handle all recurrence types. For `daily`, a streak is consecutive days with a completion log. For `times_per_week`, a streak is consecutive weeks where the target count was met.

**Display:** Add streak to `HabitCard` — current streak number with a flame icon (🔥) next to the habit title. Show best streak as a small secondary label. If `missedYesterday` is true, show an amber "Don't miss twice" indicator instead.

**Data:** No schema change needed. All required data lives in `log_entries` (source_id + entry_date + source_type).

---

### 2. Today View

**What:** A new `/today` route as the default landing page (replacing or sitting alongside `/calendar`).

**Why:** The weekly calendar is ideal for planning but too dense for daily execution. Users need a clean "what do I do today" surface that takes 3 seconds to process.

**Layout:**

- **Header:** Today's date + a streak summary line (e.g., "3 active streaks · 2 pending today")
- **Habits section:** Each habit due today as a card with title, streak count, and a completion button. Boolean habits get a checkmark button. Numeric habits get a quick-entry field inline.
- **Calendar items section:** Todos scheduled for today in chronological order.
- **Goal pulse section:** A compact row of goal progress bars at the bottom — passive context, not primary.

**Completion interaction:** Tapping the checkmark on a boolean habit should immediately mark it complete (optimistic update), trigger a brief green flash animation on the card, and update the streak count in place. No drawer, no navigation.

**Route:** `/today` — update `Sidebar.tsx` to add Today as the first nav item and make it the default redirect from `/`.

---

### 3. Live Habit Status on HabitCard

**What:** HabitCard should reflect today's completion state.

**Why:** Currently the habits page looks identical at 6am (nothing done) and 10pm (everything done). This is a missed motivational signal.

**States to display:**

| State | Visual |
|---|---|
| Pending (due today) | White card, subtle blue left border |
| Completed today | Light green tint, checkmark badge |
| Skipped today | Light gray tint, dash badge |
| Not due today | Neutral, no status indicator |
| Paused | Muted, pause icon |

**Implementation:** The `HabitsPage` already fetches `LogEntry[]` via `logsService.list()`. Pass today's logs down to `HabitCard` as a prop. Use the existing `getHabitOccurrenceStatusMap()` from `lib/habit-status.ts` to derive status per habit per date.

---

### 4. Completion Micro-interaction

**What:** When a habit is marked complete, provide immediate visual feedback.

**Why:** Atomic Habits calls this the cardinal rule of behavior change — make it immediately satisfying. Right now nothing happens visually when a habit is completed.

**Spec:**
- On completion: card briefly animates (scale up 1.02 → back to 1.0 over 200ms), background flashes green for 300ms, then settles into "Completed" state.
- If completing sets a new streak milestone (7, 14, 30, 60, 100 days), show a small toast: "🔥 7-day streak on [Habit Name]!"
- Use Tailwind `transition` classes + a brief `useState` flag for the animation. No external animation library needed.

---

## Tier 2 — Next Sprint

These features close the competitive gap with Griply and TickTick and add depth to the analytics layer.

---

### 5. Habit Completion Heatmap

**What:** A 12-week calendar grid (GitHub contribution graph style) showing completion history per habit.

**Why:** The most shareable visual in the habit app category. Makes progress tangible and creates a "don't break the chain" psychological contract.

**Spec:**

Component: `components/habits/HabitHeatmap.tsx`

- 12 columns (weeks) × 7 rows (days of week), or laid out as a horizontal strip of 84 squares
- Each square is colored based on completion: empty = light gray, completed = green (darker = higher value for numeric habits), skipped = amber
- Hovering a square shows a tooltip: date + value logged (if numeric)
- Place this in the habit detail page/drawer, or as a collapsible section on the expanded HabitCard

**Data:** Computed from `log_entries` filtered by `source_id = habitId` over the last 84 days.

---

### 6. Expanded Analytics

**What:** Replace the current 4-card + 1-chart analytics page with a richer dashboard.

**New sections to add:**

**Per-Habit Completion Table:** A table showing each habit with columns for: 7-day rate, 30-day rate, current streak, best streak, and a sparkline trend. Sortable by any column.

**Streak Leaderboard:** Your own habits ranked by current streak. A simple ordered list — "1. Meditation 🔥 21 · 2. Morning run 🔥 14 · 3. Read 🔥 6". Creates competition with yourself.

**Weekly Comparison Card:** "This week: 18 completions vs 14 last week (+29%)." Simple and motivating.

**Best/Worst Day of Week:** "Your strongest day is Tuesday. Your weakest is Saturday." One line of text, computed from the last 8 weeks of `log_entries`.

**Goal Trajectory Chart:** For each goal, plot: actual cumulative value (solid line) vs required pace to hit target on time (dashed line). If the user is ahead of pace, color the area green. Behind pace, amber. Add a projected completion date label.

---

### 7. Identity + Cue Fields on Habit

**What:** Add optional `identity_statement` and `cue_context` fields to the Habit model.

**Why:** This is the core Atomic Habits differentiator. "I am someone who exercises" is fundamentally different from "Exercise 3x/week." One is identity, one is a task.

**Schema addition:**

```sql
alter table habits add column identity_statement text;
alter table habits add column cue_context text;        -- "after morning coffee"
alter table habits add column cue_time time;           -- preferred execution time
alter table habits add column minimum_version text;    -- 2-minute rule fallback
```

**UI:** Add these as optional fields in `HabitForm.tsx` under an expandable "Habit context (optional)" section. Don't make them required or prominent — they're power-user fields.

**Display:** Show `identity_statement` as italic subtext below the habit name on HabitCard. Show `cue_context` in the right drawer item detail. Show `minimum_version` in the drawer when a user is about to mark something as skipped — "Can't do the full habit today? Try: [minimum_version]."

---

### 8. Never Miss Twice Alert

**What:** When a habit was skipped yesterday (or the last required occurrence was missed), highlight today's instance with a distinct visual treatment.

**Why:** Atomic Habits says missing once is an accident; missing twice is the start of a new habit. The app should make this visible without being punishing.

**Spec:**
- On the calendar, habit occurrences where `missedYesterday = true` get a subtle amber left border
- On the Today view, these habits appear first in the list with a label: "Back on track today?"
- No negative language — frame it as recovery, not failure

**Data:** Use `StreakResult.missedYesterday` from the streak engine (Tier 1, feature 1).

---

## Tier 3 — Differentiating Features

Ship these after Tier 1 and 2 are solid. These are what make the app the best in the category.

---

### 9. Habit Stacking

**What:** Allow users to chain habits together into a sequence. "After [habit A], I will [habit B]."

**Schema:**

```sql
create table habit_stacks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  preceding_habit_id uuid references habits(id) on delete cascade,
  following_habit_id uuid references habits(id) on delete cascade,
  sort_order int default 0,
  created_at timestamptz not null default now()
);
```

**UI:** On the Habits page, show stacked habits as a visual sequence — connected cards with an arrow between them. When habit A is completed, habit B card gets a "You're up next" highlight.

---

### 10. Weekly Review Flow

**What:** A structured weekly review prompted every Sunday evening.

**Schema:**

```sql
create table weekly_reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  week_start date not null,
  reflection_text text,
  score int check (score between 1 and 10),
  created_at timestamptz not null default now()
);
```

**UI:** A multi-step modal (3 steps):
1. Your week in numbers — auto-populated completion rates and streak changes
2. Reflection — free text: "What worked? What didn't?"
3. Score — a 1-10 slider for the week overall

Show a "Weekly Review ready" prompt in the sidebar on Sundays. Store reviews and surface a trend in Analytics ("Your weekly scores: 7, 8, 6, 9").

---

### 11. Habit Pause

**What:** Allow users to pause a habit (e.g., for vacation or injury) without deleting it.

**Schema addition:**

```sql
alter table habits add column is_paused boolean not null default false;
alter table habits add column paused_until date;
```

**UI:** A "Pause" option in the habit card overflow menu. Prompts for a resume date (optional). Paused habits don't appear on the calendar or Today view. They show in the habits list with a muted style and a "Paused until [date]" label.

---

## Non-Goals for This Phase

- Mobile-first redesign (keep desktop-first)
- Social / sharing features
- External integrations (Apple Health, Google Calendar, banking APIs)
- AI-generated habit recommendations
- Notifications / push reminders (plan the data model but don't build the delivery layer yet)

---

## Open Questions

- Should `/today` replace `/calendar` as the default route, or sit alongside it as a separate nav item?
- For the streak engine with `times_per_week` recurrence — does the week reset on Monday or match the user's calendar week start?
- Should identity statements be optional per habit, or set once at the user/profile level ("I am a healthy person") and inherited?
- For the heatmap — per-habit (on the detail view) or aggregated across all habits (on analytics)?
