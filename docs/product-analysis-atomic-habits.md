# Life Tracking App — Deep Product Analysis
### Atomic Habits Framework + Competitive Teardown
*Generated April 21, 2026*

---

## Executive Summary

You've built a genuinely solid foundation. The data model is well-thought-out, the calendar-first UX philosophy aligns with how high-performers actually think about their weeks, and the Goals → Habits → Logs hierarchy is architecturally sound. However, right now the app is a *tracking system*, not yet a *behavior change system*. Atomic Habits is not just a framework for organizing habits — it's a specific psychological model for how habits form, stick, and compound. The gap between where the app is and where it needs to be to win this category is almost entirely about closing that gap.

The sections below move from your strongest assets down to the most critical missing pieces, then into a prioritized roadmap.

---

## Part 1: What You Have (and What's Working)

### Strengths

**The data model is exceptional for V1.** Most habit apps treat habits as a flat checklist. You've built a proper relational model: Goals connect to Habits through `habit_goal_links`, Habits generate `habit_occurrences`, occurrences produce `log_entries`, and logs roll up into goal progress. This is exactly the architecture needed to support the "systems not goals" thesis of Atomic Habits — you just haven't surfaced it visually yet.

**Calendar-first is the right bet.** TickTick and Griply both suffer from the same problem: habits live in a separate tab, disconnected from your schedule. Your thesis — that habit execution lives on the calendar — is genuinely differentiated and aligns with Atomic Habits' "implementation intention" concept (specifying *when* and *where* you'll do a behavior dramatically increases follow-through rates).

**Recurrence flexibility is best-in-class.** Supporting `daily`, `weekdays`, `times_per_week`, `times_per_month`, and `day_of_month` in a clean RecurrenceBuilder puts you ahead of most apps in this space. Most apps only support daily or specific weekdays.

**Goal type architecture is strong.** The `target / accumulation / limit` three-way split maps directly to how real life goals work (reach X, accumulate Y, stay under Z). This is much more expressive than Griply's binary goal system.

**The analytics foundation exists.** You have Recharts wired up, a `buildAnalyticsSnapshot` function, and `GoalProgressBar` — you just need to dramatically expand what you're computing and visualizing.

---

## Part 2: The Atomic Habits Gap Analysis

Atomic Habits describes habit formation through four laws: **Make It Obvious, Make It Attractive, Make It Easy, Make It Satisfying.** Every gap below maps to one of these laws.

---

### Law 1: Make It Obvious — *The Cue Layer (Missing)*

Atomic Habits argues that the cue is the most important step in the habit loop. Without a clear cue, habits die before they start.

**What's missing:**

**Implementation Intentions.** The most evidence-backed technique in behavior change research. "When I [CUE], I will [BEHAVIOR] at [LOCATION]." Your `Habit` model has no concept of *when* or *where* the habit happens beyond recurrence type. Add optional fields `cue_time` (a preferred time of day), `cue_location`, and `cue_context` (e.g., "after my morning coffee"). These should surface on the habit card and feed into calendar scheduling defaults.

```ts
// Suggested addition to Habit type
cue_time?: string;           // "07:30" — preferred execution time
cue_location?: string;       // "home office"
cue_context?: string;        // "after morning coffee"
implementation_intention?: string; // full "when/where/how" note
```

**No "Today" dashboard.** Right now your default landing is the weekly calendar. That's great for planning but terrible for daily execution. Users need to wake up and see: *"Here are the 4 things I need to do today."* Griply's entire home screen is this view. A Today tab or a prominently visible "today column" in the week view with a quick-complete UX is critical. This is the single most-used surface in any successful habit app.

**Habit cards show no execution status.** On the Habits page, a `HabitCard` shows name, recurrence type, and tracking type. It shows *nothing* about whether today's instance is done, pending, or skipped. This means the most important signal — "what do I still need to do today?" — is invisible. Every habit card should have a real-time status indicator for today.

**No habit ordering / priority.** Users can't signal which habits matter most. A simple drag-to-reorder or manual priority score would help users develop a daily cue sequence (the "habit stack").

---

### Law 2: Make It Attractive — *The Craving Layer (Missing)*

This law is about making the habit something you look forward to. The strongest mechanism here is identity.

**What's missing:**

**Identity-Based Habit Framing.** This is Atomic Habits' most famous idea: *"Every action is a vote for the type of person you wish to become."* The app has no concept of identity. You should add an optional `identity_statement` field to habits: "I am someone who exercises regularly." Or even at the Goal level: "I am becoming a healthy person." Display this as a subtle tagline on the habit card or goal card. This reframes the act of checking in from "I completed a task" to "I cast a vote for who I am."

**No motivational context visible during execution.** When a user clicks on a calendar item in the right drawer, all they see is the task. They should also see: which goal it serves, current goal progress, and ideally a short reminder of *why* they set this habit. The `description` field on `Habit` exists but isn't surfaced in the drawer or card.

**Temptation Bundling.** Allow users to tag a habit with something enjoyable they pair it with: "I only listen to my favorite podcast while I'm at the gym." This is a named technique from the book and would be a genuinely differentiated feature. A simple optional `temptation_bundle` text field on the Habit model would be enough.

**No social accountability layer (plan for it now).** Griply has friend-sharing and streaks visible to others. You've explicitly excluded this from V1, which is fine — but your data model should support a `shared_with` or `accountability_partner_id` concept now so it can be added without a schema migration later.

---

### Law 3: Make It Easy — *The Friction Layer (Missing)*

This is where most habit apps fail. They add friction at exactly the moment users need the least. Atomic Habits says: reduce friction to 2 seconds or less.

**What's missing:**

**No One-Click Completion.** Currently, completing a habit involves: navigating to the calendar, finding the item, clicking to open the drawer, then marking it complete. That's 4 interactions. For boolean habits, this should be a single tap from any view. Griply achieves this with a checkmark directly on the habit card. Your calendar items should have a quick-complete affordance (a checkmark button) inline, without needing to open the drawer.

**No "Two-Minute Rule" support.** Atomic Habits says every habit should have a "scaled down version" — the minimum viable behavior for a bad day. Add an optional `minimum_version` field to `Habit`: e.g., "Run 5 miles" has a minimum version of "Put on running shoes." Surface this in the item drawer when a user is about to skip. *"Can't do the full habit? Try the 2-minute version: [minimum_version]."* This could prevent skips on hard days and dramatically improve long-term retention.

**No Environment Design prompts.** Atomic Habits dedicates a full chapter to environment design (making cues visible, making habits easy to start). A simple "Setup reminder" feature — a note for what the user should do the night before to prepare — would embody this. e.g., "Lay out your gym clothes the night before."

**Recurrence "X times per week" is vague.** When a user sets a habit to 3x/week, your `selectEvenly` algorithm distributes it evenly — but the user has no say in *which* days. You should surface this: let users pick specific days OR accept "any 3 days this week" with a free-distribution model that shows which days remain. Currently users can't tell if they've met their weekly quota or not.

**No friction-free numeric logging.** For numeric-type habits, logging requires opening the drawer and typing a value. Consider a swipe-to-log or an inline numeric input on the calendar item card for quick entry without opening the drawer.

---

### Law 4: Make It Satisfying — *The Reward Layer (Missing)*

This is the biggest gap. Atomic Habits says immediate rewards are essential because the brain is wired for immediate gratification. Without satisfaction signals, habits don't stick.

**Streaks — The Single Most Critical Missing Feature.**

This is not optional. Every successful habit app in existence — Duolingo, Streaks, Habitica, Griply, TickTick — makes streaks a centerpiece. Your `lib/habit-status.ts` computes whether a habit was completed on a given date, but there is zero streak computation, zero streak display, and zero streak-based motivation. This is the highest-priority gap in the entire app.

What you need:
- `current_streak` (days/weeks in a row, depending on recurrence)
- `best_streak` (all-time record)
- "Never miss twice" indicator (did the user recover after a miss?)
- Streak display on every `HabitCard`
- A streak milestone system (7 days → 30 days → 100 days)

The data is all there in `log_entries` and `habit_occurrences` — you just need a `computeStreakForHabit(habitId, logs, recurrenceType)` function in `lib/`.

**No Celebration / Completion Micro-interactions.** When a user marks a habit complete, nothing happens visually. The card doesn't change color. There's no animation. No confetti. No "🔥 7-day streak!" moment. Atomic Habits calls this the "cardinal rule of behavior change: never miss twice." But there's an equally important corollary: always celebrate completion immediately. Add a brief animation and a streak update on completion. This is the dopamine hit that makes habits self-reinforcing.

**No Habit Scorecard / Weekly Review.**  Atomic Habits describes a "Habits Scorecard" — a regular review of which habits are working. Your Analytics page exists but only shows global metrics. You need per-habit analytics: completion rate over time, streak history, best/worst weeks, and a weekly review modal that prompts users to reflect. *"This week: 5/7 days on Meditation. Your best week ever. Keep it up."*

**No Per-Habit Completion Heatmap.** This is the "GitHub contribution graph for habits" that users love. A 12-week grid of colored squares showing completion history per habit. It makes progress tangible and creates a "don't break the chain" psychological contract. This is the single most shared screenshot in habit app communities and would be your most viral feature.

**No Habit Stacking visualization.** Atomic Habits' habit stacking formula: "After [current habit], I will [new habit]." Build a way to chain habits: show them as a sequence on the habits page and in the drawer. When habit A is completed, habit B gets highlighted as "next up."

**Goal "Plateau of Latent Potential" visualization.** One of Atomic Habits' most powerful ideas: progress is happening underground before it becomes visible. An accumulation goal that's 20% achieved isn't failing — it's building. Add a motivational framing to goal progress bars: for accumulation goals behind pace, show a "Compounding in progress" message. Visualize the trajectory (if they maintain current rate, when will they hit the goal?). This is the opposite of the discouraging "behind pace" message most apps show.

---

## Part 3: Competitive Feature Gap Analysis

### vs. Griply

Griply's core strengths you're missing:
- **Streak display on every habit** (prominently, with fire emoji and number)
- **Today view** as the default home screen
- **Color-coded categories** for habits (health, finance, learning, etc.)
- **Friend accountability** — shared streak visibility
- **Progress photos** — optional image attachment to log entries
- **One-tap completion** from the main list without opening a detail

Where you're ahead of Griply:
- Calendar-first execution model (Griply has a calendar but it's secondary)
- Richer goal types (Griply goals are simpler)
- Better recurrence flexibility
- The Goals ↔ Habits ↔ Logs data model is architecturally superior

### vs. TickTick Habits

TickTick's habit strengths:
- **Per-habit completion stats** with weekly/monthly breakdown
- **Best streak and current streak** on each habit
- **Habit check-in notes** — a text note per completion
- **Calendar heatmap** per habit (12-week view)
- **Pause habit** without deleting (e.g., during vacation)

Where you're ahead:
- No equivalent to your Goal type system
- TickTick habits can't link to numeric goals
- No calendar-first integration

### vs. Habitica

Habitica's gamification you could selectively adopt:
- **XP and leveling** for habit completion (optional — may not fit your premium/calm aesthetic)
- **Immediate visual reward** on completion (the character levels up)
- **Damage mechanic** for skipping (negative consequence framing — optional)

The aesthetic gap is real: Habitica is playful/gamified, TickTick is utility-first, Griply is clean but shallow. Your positioning should be: **premium, calm, intelligent** — the habit app for adults who are serious about execution, not gamification. This is a real white space.

---

## Part 4: Data Model Improvements

### Add to `habits` table

```sql
-- Atomic Habits cue layer
cue_time              time,              -- preferred execution time
cue_location          text,              -- "home gym"
cue_context           text,              -- "after morning coffee"
implementation_intention text,           -- "When/where/how" full sentence

-- Atomic Habits ease layer
minimum_version       text,              -- 2-minute rule version
environment_setup     text,              -- "lay out gear the night before"

-- Atomic Habits identity layer
identity_statement    text,              -- "I am someone who..."
temptation_bundle     text,              -- "I pair this with..."

-- Execution state
is_paused             boolean default false, -- pause without deleting
paused_until          date,              -- optional resume date
difficulty_rating     int check (difficulty_rating between 1 and 5),
sort_order            int default 0,     -- manual ordering

-- Category
category              text,              -- 'health', 'finance', 'learning', etc.
color_tag             text               -- hex color for visual grouping
```

### Add streak computation to `lib/`

```ts
// lib/streak.ts
export interface StreakResult {
  current: number;
  best: number;
  lastCompletedDate: string | null;
  missedYesterday: boolean;
  neverMissedTwice: boolean; // did they recover after every miss?
}

export function computeStreak(
  habitId: string,
  recurrenceType: RecurrenceType,
  recurrenceConfig: RecurrenceConfig,
  logs: LogEntry[],
  today: string,
): StreakResult { ... }
```

### Add to `log_entries` table

```sql
-- Already has `note` — add:
completion_photo_url  text,    -- optional photo attachment
mood_rating           int,     -- 1-5 mood at time of completion
difficulty_felt       int,     -- 1-5 how hard was it today
```

### New table: `habit_stacks`

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

### New table: `weekly_reviews`

```sql
create table weekly_reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  week_start date not null,
  reflection_text text,
  habits_to_keep text[],
  habits_to_stop text[],
  habits_to_start text[],
  overall_score int check (overall_score between 1 and 10),
  created_at timestamptz not null default now()
);
```

---

## Part 5: UX Improvements by Screen

### Habits Page (biggest opportunity)

The current `HabitCard` shows: name, recurrence type, tracking type badge. That's it. The most important signals are missing.

**Redesign the HabitCard to show:**
- Habit name + category color strip on left edge
- Today's status badge: `✓ Done` / `○ Pending` / `→ Skipped` / `⏸ Paused`
- Current streak with flame icon: `🔥 12`
- Completion rate last 30 days: `87%`
- Linked goal chip (first one, with "+N more" if multiple)
- Quick-complete button (checkmark icon) for boolean habits
- Quick-log button (pencil icon) for numeric habits

This transforms the habits page from a "settings panel for recurring templates" into a live dashboard.

**Group habits by time of day**, not just by goal. Morning / Afternoon / Evening / Anytime groupings make the day feel structured. Griply does this well.

**Add a habit completion grid** (12-week heatmap) as an expandable section on each habit card or as a dedicated view on the habit detail page.

### Today View (new screen — highest priority)

Add a `/today` route as the actual default landing screen. The weekly calendar remains, but Today is the first thing users see.

Layout:
- **Top:** Date + motivational streak summary ("12-day streak on 3 habits 🔥")
- **Middle:** Today's habit checklist — each habit as a card with 1-click complete/log
- **Bottom:** Today's calendar items (todos) with time context
- **Side panel or bottom:** Goal progress snapshot — how today's actions impact each goal

This is the screen that makes the app feel alive every single morning.

### Analytics Page (needs major expansion)

Current state: 4 stat cards + 1 area chart + goal progress bars. This is a skeleton.

**What to add:**

**Per-habit completion rates** — a table or card grid showing each habit's completion rate over 7d / 30d / 90d with sparkline trend.

**Streak leaderboard** — your own habits ranked by current streak. This makes streaks competitive with yourself.

**Habit completion heatmap** — GitHub-style contribution grid. Make this filterable by habit. This is the #1 most screenshotted/shared feature in any habit app.

**Goal trajectory chart** — for each goal, show: current value, pace line (where you'd need to be to hit the goal on time), and actual value. This is the "Plateau of Latent Potential" visualization. If you're behind but trending well, say so.

**Weekly comparison card** — This week vs last week. Simple: "You completed 23 habit instances this week vs 18 last week. +28%." This creates week-over-week momentum.

**Best and worst day of week** — e.g., "Your strongest day is Tuesday. Your weakest is Saturday." Actionable insight.

### Calendar (in-progress improvements + suggestions)

The drag/drop and day load indicators you're building are exactly right. Additional suggestions:

**Goal progress ribbon** — At the top of the calendar, a thin horizontal row of your active goals showing current progress as a mini progress bar. Visible context while planning the week.

**Habit streak indicators on calendar items** — When a habit occurrence appears on the calendar, show the current streak count as a small badge. Seeing "🔥 6" on tomorrow's run makes you want to complete it.

**"Never Miss Twice" visual alert** — If a user skipped yesterday's instance, highlight today's instance with a subtle amber border and tooltip: "You missed yesterday. Don't miss twice."

**Completion color coding** — Completed items turn green, skipped items turn gray, pending items stay white/neutral. Currently items likely look the same regardless of status.

### Goals Page / Goal Detail

Add to the Goal Detail page:
- **Trajectory projection:** "At your current pace, you'll hit this goal on [date]." or "At your current pace, you'll miss this goal by [amount]."
- **Linked habit completion rates** — for each linked habit, show its recent completion rate inline on the goal detail
- **Log history timeline** — chronological list of all log entries that contributed to this goal
- **"Compound effect" visualization** — for accumulation goals, show the exponential/linear compounding curve

---

## Part 6: Prioritized Roadmap

### Tier 1 — Ship These Now (Fixes the biggest retention killers)

1. **Streak computation engine** (`lib/streak.ts`) and display on `HabitCard`. One function, huge impact.
2. **Today view** — a `/today` route with a clean habit checklist + calendar items. This is the daily re-engagement surface.
3. **Habit card status indicator** — show today's completion status on each habit card. The habits page currently looks the same at 6am as it does at 10pm after all habits are done.
4. **One-click completion** on HabitCard for boolean habits (without opening a drawer).
5. **Completion animation** — even a simple CSS transition on the checkmark when a habit is completed. This is the dopamine trigger that makes habits self-reinforcing.

### Tier 2 — Ship in the Next Sprint (Closes the competitive gap with Griply/TickTick)

6. **Per-habit completion heatmap** (12-week grid) — add to habit detail or expand on habit card.
7. **Expanded analytics** — per-habit completion rates, streak leaderboard, weekly comparison.
8. **Goal trajectory chart** — pace line vs actual value over time.
9. **Identity statement field** on Habit — surfaces on card/drawer as a subtle tagline.
10. **Cue capture fields** on Habit — `cue_time`, `cue_context`, `implementation_intention` — feeds into calendar scheduling defaults.

### Tier 3 — Differentiating Features (Makes you the best in the category)

11. **Habit stacking** — chain habits together, show the stack in sequence.
12. **Two-minute rule / minimum version** — optional minimum habit field, surfaced when user is about to skip.
13. **Weekly review flow** — a structured weekly review modal (prompted every Sunday) with reflection fields and habit scorecard.
14. **Goal "Plateau of Latent Potential" framing** — motivational copy on goal cards when behind pace.
15. **Category / color tags** on habits — visual grouping by life area (health, finances, learning, relationships).
16. **Pause habit** (without deleting) — for vacations, injury, etc.
17. **Never miss twice alert** on calendar — amber highlight when a habit was skipped yesterday.
18. **Log entry mood/difficulty rating** — optional 1-5 rating per completion. Over time, surfaces patterns ("Running feels hardest on Mondays").

---

## Part 7: Name and Positioning Note

The current name "Trackr" in the sidebar is a placeholder. Given the Atomic Habits thesis, consider naming the app something that evokes identity or systems rather than tracking. Some directions:

- **Forma** (about forming identity/habits)
- **Compound** (compound interest on your habits)
- **Keystone** (keystone habits)
- **Strata** (building layers of identity over time)
- **Votum** (every completion is a vote)

The name doesn't need to be decided now, but "Trackr" undersells the vision. You're not building a tracker — you're building a behavior change engine.

---

## Summary of Top 5 Actions

1. **Build `lib/streak.ts` and add streak display to HabitCard.** This is the most impactful single change you can make. Every competitor has this. Atomic Habits is built on it.

2. **Create a `/today` route** as a clean daily execution dashboard. The calendar is great for planning — users need a simpler surface for daily execution.

3. **Add today's completion status to HabitCard.** The habits page should look different in the morning vs. the evening.

4. **Add a completion heatmap** (12-week grid) to the habit detail or analytics page. This is the most viral feature in the category and makes progress feel real.

5. **Add identity + cue fields to Habit** (`identity_statement`, `cue_context`, `implementation_intention`). This is what separates an Atomic Habits app from a generic habit tracker. Surface these in onboarding and in the habit card/drawer.
