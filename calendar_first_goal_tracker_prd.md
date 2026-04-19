# Calendar-First Goal Tracker — V1 PRD

## Product summary
A desktop-first web app with a Google Calendar-like main view where scheduled todos and recurring habits live on the calendar and roll up into numeric goal tracking.

The product should feel like a blend of Google Calendar, Copilot Money, and Griply:
- **Calendar-first interaction model**
- **Recurring habits that generate daily/weekly/monthly action items**
- **Numeric goals that update from logged values and completed actions**
- **Clean, premium, calm UI**

---

## Core product thesis
Most habit trackers separate habits, tasks, and goals into disconnected tabs. This app should connect them.

The core hierarchy is:
- **Calendar** = primary interaction layer
- **Habits** = recurring templates/systems
- **Todos** = scheduled execution items
- **Goals** = numeric measurement layer
- **Logs** = actual values recorded over time

The user should be able to look at a calendar day or week and understand:
- what they need to do
- which habits are scheduled
- which goals those actions support
- what measurable progress they made

---

## V1 goals
1. Make the **weekly calendar** the default home screen.
2. Allow users to create **numeric goals**.
3. Allow users to create **scheduled habits** with flexible recurrence.
4. Allow habits to generate or attach to calendar items.
5. Allow todos and habits to link to one or more goals.
6. Allow users to log numeric values from calendar items.
7. Automatically update goal progress from logs and linked items.
8. Keep the product **desktop-first** and manually tracked for now.

---

## Non-goals for V1
- Mobile-first design
- AI recommendations
- External integrations (banking, Apple Health, Google Calendar sync)
- Advanced collaboration / shared spaces
- Highly abstract or non-numeric goals
- Full automation pipelines

---

## Primary user stories
1. As a user, I want to open the app and land on a **Google Calendar-like week view**.
2. As a user, I want to create a **numeric goal** such as “Lose 5 lbs” or “Spend less than $600/week.”
3. As a user, I want to create a **habit** with flexible scheduling such as:
   - 3 times per week
   - Mon/Tue/Wed
   - first day of every month
4. As a user, I want that habit to appear as a calendar item or generate scheduled instances.
5. As a user, I want to click a calendar item and either:
   - mark it complete
   - mark it skipped
   - log a numeric value
   - log a value and complete it
6. As a user, I want that entry to roll up into my linked goal progress.
7. As a user, I want to see goal context while I’m planning my week.

---

## Core entities

### 1. Goal
A measurable outcome tracked numerically.

Examples:
- Lose 5 lbs
- Spend less than $600/week
- Save $2,000/month
- Read 500 pages/month

### 2. Habit
A recurring system with a schedule and optional numeric logging.

Examples:
- Weigh in
- Log spending
- Read
- Workout

### 3. Todo
A scheduled action item on the calendar.

Examples:
- Grocery run
- Budget review
- Leg workout
- Meal prep

### 4. Log Entry
A recorded value or completion event associated with a habit, todo, or manual entry.

Examples:
- weight = 178.2 lb
- spending = 84 USD
- reading = 22 pages

---

## V1 goal types
Support these three only:

### Target goal
Reach a target value.
Examples:
- Reach 170 lb
- Save $5,000

### Accumulation goal
Accumulate progress over a date range.
Examples:
- Read 500 pages this month
- Save $2,000 this quarter

### Limit goal
Stay below a threshold over a date range.
Examples:
- Spend less than $600/week
- Eat out less than 3 times/week

---

## V1 tracking types
Support these tracking types at the data model level, but prioritize numeric UX:
- boolean
- numeric
- amount
- duration
- measurement

For V1, numeric and amount/measurement should be emphasized in the UI.

---

## Scheduling / recurrence requirements
Habits should support a flexible recurrence builder.

### V1 recurrence modes
- Every day
- Selected weekdays (e.g. Mon/Tue/Wed)
- X times per week
- X times per month
- Specific day of month

### Future recurrence modes
- Every N days
- Last weekday of month
- Every N weeks
- Rule-based recurrence

### Scheduling principle
A habit is a template. It either:
- generates scheduled calendar instances
- or creates expected occurrences that appear in the calendar/day panel

---

## Core UX rules

### Rule 1: Calendar is the primary interaction model
The default landing screen should be **Week View**.

### Rule 2: Habits are recurring templates
Habits should not feel like a separate tab of checkboxes. They should feed the calendar.

### Rule 3: Completion is not always enough
Some items need values, not just a checkmark.
Examples:
- Weigh in -> numeric value required
- Log spending -> amount required
- Read -> pages or minutes may be required

### Rule 4: One item can support multiple goals
A habit or todo should be linkable to one or more goals.

### Rule 5: Goal feedback should appear in planning context
The user should not need to go to a separate goals page every time to understand progress.

---

## Information architecture

### Main navigation
- Calendar
- Goals
- Habits
- Inbox / Quick Add
- Analytics
- Settings

### Default landing page
- Calendar > Week View

---

## Screen specs

## 1. Calendar Screen (primary screen)
### Purpose
Main interaction surface for planning, logging, and reviewing.

### Views
- Week view (default)
- Day view
- Month view

### Layout
- **Left sidebar**: main navigation
- **Top bar**: date navigation, view switcher, quick add, filters
- **Center pane**: calendar grid
- **Right drawer**: contextual details for selected day or item

### Calendar content
Each date/time region should support:
- manual todos
- habit-generated items
- all-day items
- visual goal tags/chips
- completion / logging affordances

### Interactions
- Click empty slot -> create todo
- Click item -> open detail drawer
- Drag/drop todo -> reschedule
- Quick log from item card or drawer

### Right drawer modes
#### Day mode
Shows:
- all todos for selected day
- all scheduled habit instances
- quick numeric logs
- linked goals impacted today
- day notes (optional in V1 or V1.1)

#### Item mode
Shows:
- title
- linked habit (if any)
- linked goals
- due/start/end time
- status
- numeric input field if needed
- notes
- edit/delete actions

---

## 2. Goals Screen
### Purpose
Create and monitor numeric goals.

### Goal list view
Each goal card shows:
- title
- goal type
- target
- current progress
- unit
- date range
- on track / off track status

### Goal detail view
Shows:
- goal metadata
- progress bar / chart
- linked habits
- linked todos
- recent logs
- trend over time

### Actions
- Create goal
- Edit goal
- Link habits
- Link todos

---

## 3. Habits Screen
### Purpose
Manage recurring templates and schedules.

### Habit list view
Each habit card shows:
- name
- schedule summary
- tracking type
- linked goals
- next occurrence
- active/inactive status

### Habit builder modal / page
Fields:
- title
- description
- tracking type
- unit
- recurrence mode
- recurrence settings
- linked goals
- whether to create calendar instances automatically
- optional default duration/time block

### Scheduling UI
A structured recurrence builder, not raw cron-style rules.

---

## 4. Todo creation / editing
### Fields
- title
- description
- start datetime
- end datetime
- all-day toggle
- source type (manual vs habit-generated)
- linked habit (optional)
- linked goals
- requires numeric log? (optional)
- note

---

## 5. Quick Add / Inbox
### Purpose
Fast capture for:
- todo
- habit
- goal
- numeric log

For V1, this can be a modal or command bar.

---

## Core user flows

## Flow A: Create a goal
1. User clicks “New Goal”
2. Selects goal type: target / accumulation / limit
3. Enters title, unit, target, date range
4. Saves goal
5. App prompts user to optionally link habits or todos

## Flow B: Create a habit
1. User clicks “New Habit”
2. Enters title
3. Selects tracking type and unit
4. Configures recurrence schedule
5. Links one or more goals
6. Chooses whether instances appear on calendar automatically
7. Saves habit

## Flow C: Calendar-generated habit usage
1. User opens week view
2. Habit instance appears on appropriate day
3. User clicks instance
4. Drawer opens
5. User logs numeric value and marks complete
6. App updates habit history and linked goal progress

## Flow D: Daily spend tracking
1. User creates limit goal: Spend less than $600/week
2. User creates habit: Log spending (daily)
3. Calendar shows daily entry instance
4. User inputs spend each day
5. App sums weekly amount and displays remaining budget / threshold status

---

## Functional requirements

### Goals
- Create/edit/delete goals
- Support goal types: target, accumulation, limit
- Store target value, unit, date range
- Link to one or more habits
- Link to one or more todos
- Compute progress from logs and linked items

### Habits
- Create/edit/archive habits
- Support recurrence modes listed above
- Support tracking types listed above
- Link to one or more goals
- Generate expected or scheduled calendar instances

### Todos
- Create/edit/delete todos
- Schedule by date/time
- Support manual or habit-generated origin
- Link to one or more goals
- Mark complete / skipped

### Logs
- Create numeric log entries from calendar or forms
- Associate logs with habit, todo, or manual source
- Store units and notes
- Trigger goal progress recalculation

### Calendar
- Week view default
- Day and month views
- Show todos and habit instances on dates
- Open drawer for details
- Allow quick create and quick edit

---

## Suggested data model

### goals
- id (uuid)
- user_id
- title
- description
- goal_type (`target` | `accumulation` | `limit`)
- unit
- target_value (numeric)
- baseline_value (numeric, nullable)
- current_value_cache (numeric, nullable)
- start_date
- end_date
- is_active
- created_at
- updated_at

### habits
- id (uuid)
- user_id
- title
- description
- tracking_type (`boolean` | `numeric` | `amount` | `duration` | `measurement`)
- unit
- recurrence_type (`daily` | `weekdays` | `times_per_week` | `times_per_month` | `day_of_month`)
- recurrence_config (jsonb)
- default_target_value (numeric, nullable)
- auto_create_calendar_instances (boolean)
- is_active
- created_at
- updated_at

### habit_goal_links
- id (uuid)
- habit_id
- goal_id
- contribution_type (nullable text)
- created_at

### todos
- id (uuid)
- user_id
- title
- description
- start_datetime
- end_datetime
- all_day (boolean)
- status (`pending` | `complete` | `skipped`)
- source_type (`manual` | `habit_instance`)
- source_habit_id (nullable)
- requires_numeric_log (boolean)
- created_at
- updated_at

### todo_goal_links
- id (uuid)
- todo_id
- goal_id
- created_at

### log_entries
- id (uuid)
- user_id
- entry_date
- entry_datetime
- source_type (`habit` | `todo` | `manual`)
- source_id (nullable uuid)
- numeric_value (numeric, nullable)
- unit (text, nullable)
- note (text, nullable)
- created_at
- updated_at

### habit_occurrences (optional but recommended)
Use this if you want explicit scheduled instances separate from todos.
- id (uuid)
- habit_id
- scheduled_date
- scheduled_start_datetime (nullable)
- scheduled_end_datetime (nullable)
- status (`pending` | `complete` | `skipped`)
- linked_todo_id (nullable)
- created_at
- updated_at

---

## Calculation principles

### Target goals
Use the latest relevant value, delta from baseline, or a defined calculation rule.
Examples:
- Current weight vs target weight
- Current savings vs savings target

### Accumulation goals
Sum relevant logs over the date range.
Examples:
- total pages read this month
- total money saved this quarter

### Limit goals
Sum relevant logs over the date range and compare to threshold.
Examples:
- weekly spending must remain <= 600

### Important note
In V1, calculation logic can be simple and explicit rather than fully configurable.

---

## UX / visual design direction
- Desktop-first
- Calm, modern, premium
- White or dark-neutral base with muted accent color
- Rounded cards and panels
- Minimal clutter
- Soft charting and progress bars
- Goal chips/tags on calendar items
- Smooth microinteractions

### Inspiration notes
- Google Calendar for structure
- Copilot Money for polish and data feel
- Griply for personal productivity category

---

## Suggested tech stack
### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend / data
- Supabase
- PostgreSQL
- Prisma or direct Supabase client

### Charts
- Recharts

### Calendar implementation
- Start with a custom calendar/week grid if necessary for design control
- Alternatively use a calendar library only if it remains highly customizable

---

## V1 milestone plan

### Milestone 1: Foundation
- Project scaffold
- Auth
- Database schema
- Navigation shell
- Calendar week layout placeholder

### Milestone 2: Core objects
- CRUD for goals
- CRUD for habits
- CRUD for todos
- CRUD for logs
- Linking between objects

### Milestone 3: Calendar behavior
- Week view default
- Render todos and habit instances
- Day/month switching
- Right-side drawer
- Quick add

### Milestone 4: Goal calculations
- Progress calculation engine
- Goal summary cards
- Goal detail page
- Status indicators

### Milestone 5: Polish
- Drag/drop scheduling
- Filters
- Improved form UX
- Empty states
- loading states
- responsive-but-desktop-first refinement

---

## Open questions for post-V1
- Should habits always generate explicit todo instances, or sometimes remain lightweight expected events?
- How configurable should goal calculation logic become later?
- What integrations matter most first: financial, health, or calendar?
- Should there be journaling/day notes attached to each date?

---

# Build prompt for Claude

Use the following as the starter prompt:

---

You are an expert full-stack product engineer and UI engineer. Build a desktop-first MVP for a personal productivity web app with a **Google Calendar-like main view** where **todos and recurring habits appear on the calendar and roll up into numeric goals**.

## Product requirements
- The **main/default view must be a weekly calendar view**.
- The app should feel like a mix of **Google Calendar, Copilot Money, and Griply**.
- The app is **desktop-first**.
- For V1, focus on **manual tracking only**.
- Goals are **numeric-first**.

## Core concepts
### Goals
Support these goal types:
- target
- accumulation
- limit

Examples:
- Lose 5 lbs
- Spend less than $600/week
- Read 500 pages/month

### Habits
Habits are recurring templates with schedules.
They must support these recurrence modes:
- every day
- selected weekdays
- X times per week
- X times per month
- specific day of month

Habits must support these tracking types:
- boolean
- numeric
- amount
- duration
- measurement

### Todos
Todos are calendar items that can be standalone or generated from habits.
Todos can link to one or more goals.

### Logs
Users must be able to log numeric values from a calendar item.
Examples:
- weight = 178.2 lb
- spend = 84 USD
- reading = 22 pages

## Core UX rules
- The calendar is the primary interaction surface.
- Habits should feed the calendar, not live as disconnected checklists.
- Completion is not always enough; some items require a numeric value.
- A single habit or todo can contribute to multiple goals.
- Goal progress should be visible in planning context.

## Required screens
1. **Calendar screen**
   - week view default
   - day and month views available
   - left navigation sidebar
   - top date navigation and view switcher
   - center calendar grid
   - right-side detail drawer
   - support item click, quick add, and drag/drop rescheduling if feasible

2. **Goals screen**
   - list goals
   - create/edit goal
   - view goal detail with progress and linked habits/todos

3. **Habits screen**
   - list habits
   - create/edit habit
   - structured recurrence builder

4. **Todo creation/editing flow**
   - create/edit scheduled todos
   - link to goals
   - optionally associate with a habit

## Data model
Implement or scaffold the following entities:
- goals
- habits
- habit_goal_links
- todos
- todo_goal_links
- log_entries
- optionally habit_occurrences

Include appropriate fields for:
- goal_type
- target_value
- unit
- recurrence_type
- recurrence_config
- tracking_type
- source_type
- numeric_value
- status

## Technical requirements
- Use **Next.js + TypeScript + Tailwind + shadcn/ui**
- Use clean component structure
- Use mock data first if needed, but structure code so it can plug into Supabase/Postgres
- Prefer a polished UI over maximum backend completeness in the first pass
- Build reusable components for calendar items, goal cards, drawer panels, and forms

## Deliverables
1. Create the app structure and routes
2. Build the weekly calendar as the primary screen
3. Build mock data and types for goals, habits, todos, and logs
4. Implement creation/edit forms and detail drawer interactions
5. Implement goal progress calculations for target, accumulation, and limit goals
6. Keep the visual design premium, clean, and calm

## Design direction
- modern, premium, minimal
- calendar should resemble Google Calendar structurally
- analytics cards and progress bars should feel closer to Copilot Money
- use rounded panels, soft borders, and excellent spacing
- optimize for desktop first

Start by:
1. defining the folder structure
2. creating the TypeScript types
3. generating the seeded mock data
4. implementing the layout shell
5. implementing the weekly calendar view
6. then build forms and detail flows

As you code, make thoughtful product decisions that preserve the app’s core thesis: **calendar-first execution tied to measurable goals**.

---

