# Planning-First Friendly UX Design

Date: 2026-04-20
Status: Approved for planning
Scope: Calendar-first UX improvements (balanced release)

## 1. Problem Statement
The current app has core entities (goals, habits, todos, logs) and a calendar shell, but the user experience still feels fragmented when planning a week and following through during the day.

Primary UX gaps:
- Planning context is weak in Calendar. Users can see items, but not clearly which items matter most for goals.
- Linking and cross-entity context are not visible enough at point of action.
- Day-level execution is functional but not optimized for quick, low-friction follow-through.
- Motivation signals are limited and should be supportive, not stressful.

## 2. Product Direction (Locked)
Approach: Planning-first.

Tone and UX principle:
- Informative, friendly, and calm.
- No risk-scoring language or overbearing alert patterns.
- Usability is equally important to planning impact.

Success outcomes for this phase:
1. Users can identify top 3 goal-impact items in under 60 seconds.
2. Planning-to-execution conversion improves (more planned items completed/logged).

Release scope (balanced): 4-6 high-impact changes across planning and follow-through.

## 3. In-Scope UX Changes
### 3.1 PlanningRail (new, Calendar right side top)
Purpose: Bring planning context into the default calendar workflow.

Sections:
- This Week Focus: highest goal-impact items for current week.
- Ready to Schedule: unscheduled or loosely planned habits/todos.
- Quick Wins Today: short, easy actions that maintain momentum.

Row actions (one-step availability where applicable):
- Schedule
- Move to Today
- Complete
- Log

### 3.2 ImpactItemChip (new, reused in Week/Day/Month)
Purpose: Make goal relevance visible on every calendar item.

Displays:
- Impact level badge: High, Medium, Low
- Linked goal chips (max 2 visible + +N overflow)
- Status marker (pending, complete, skipped)

Interaction:
- Existing item click behavior remains (open drawer)

### 3.3 PlannerDrawer (evolution of current RightDrawer)
Purpose: Shift drawer from item-only details to planning-supportive context.

Modes:
- Day Mode (default during week planning):
  - Day agenda
  - Impacted goals summary
  - Quick actions
- Item Mode:
  - Existing item details
  - Inline log and complete controls

### 3.4 GoalPulseStrip (new, Calendar header)
Purpose: Friendly status framing without risk language.

Buckets:
- Great progress
- Steady
- Needs a touch

Behavior:
- Clicking a bucket filters calendar and planning rail to relevant items/goals.
- Use neutral/supportive language and visual treatment.

### 3.5 WeeklyReviewCard (new, lightweight motivation)
Purpose: Reinforce momentum without pressure.

Content:
- Planned vs done count
- Consistency streak
- Top contributed goal

Placement:
- Analytics page (primary)
- Optional condensed version in Calendar rail footer

## 4. Information Architecture Changes
Keep:
- Calendar as primary interaction model and default landing page.

Change:
- Calendar right side becomes Planning + Day Context surface.
- Goals and Habits pages remain management/configuration views.
- Weekly planning should be executable from Calendar without forcing navigation.

## 5. Interaction Rules (Usability Guardrails)
1. Core planning actions should be at most 2 clicks.
2. Every planning surface should expose a direct next action (schedule, complete, or log).
3. Filters and planning context should persist during session.
4. Avoid introducing warning-heavy states; prioritize clarity and confidence.

## 6. Data Flow and State Model
Introduce `usePlanningSnapshot(view, dateRange)` as the calendar data orchestration layer.

Inputs:
- Todos
- Habits
- Logs
- Goals
- Link tables (`habit_goal_links`, `todo_goal_links`)

Outputs:
- `calendarItems`
- `planningRailGroups`
  - `thisWeekFocus`
  - `readyToSchedule`
  - `quickWinsToday`
- `goalPulseBuckets`
  - `greatProgress`
  - `steady`
  - `needsATouch`

Action loop:
1. User acts from rail/drawer/chip context.
2. Optimistic UI update applies immediately.
3. Service mutation executes.
4. Background refresh reconciles state.
5. Quiet success feedback is shown.

## 7. Friendly Classification Logic
### 7.1 Item Impact Tier (visible)
- High:
  - linked to 2+ goals, or
  - linked to 1 goal and requires numeric log
- Medium:
  - linked to exactly 1 goal and does not require numeric log
- Low:
  - no linked goals

### 7.2 Goal Pulse Bucket (visible label, no numeric score shown)
- Great progress: ahead of expected pace for goal date range
- Steady: near expected pace
- Needs a touch: behind pace or no recent contribution

Note: Internal pace calculations may exist, but no “risk score” is shown in UI copy.

## 8. Error Handling and Resilience
1. Fetch failures:
- Keep calendar visible.
- Show inline refresh failure message with retry action.

2. Action failures:
- Roll back optimistic state.
- Show contextual, calm message (example: "Couldn’t log value. Try again.").

3. Partial linking data:
- Render item normally.
- Omit impact metadata where unavailable.
- Do not block planning workflows.

## 9. Validation Strategy
### 9.1 Unit tests
- Impact tier classification
- Goal pulse bucketing
- Planning rail grouping and sorting

### 9.2 Integration tests
- Day Mode quick actions update calendar and rail correctly
- Inline log-and-complete flow
- GoalPulseStrip filtering behavior

### 9.3 UX acceptance checks
- Top 3 goal-impact items identifiable in <60 seconds
- Planning action to schedule/complete/log in <=2 clicks

## 10. Out of Scope for This Phase
- New high-friction scoring frameworks
- Heavy notification systems
- Broad redesign of non-calendar IA
- AI planning recommendations

## 11. Future Opportunity (Execution-First Follow-up)
After this planning-first release is stable, the next UX phase can prioritize execution speed improvements (faster logging, batch actions, and keyboard-first completion paths) while keeping the same friendly tone.
