# Hybrid Editorial / Operator UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved hybrid editorial / operator UI redesign across the shell and primary pages while preserving first-class light and dark mode support.

**Architecture:** Implement the redesign in layers so the visual language stays coherent: browser/theme metadata first, then tokens and primitives, then shell chrome, then `Today` as the benchmark page, then denser operator surfaces (`Habits`, `Calendar`), then secondary alignment (`Goals`, `Analytics`) and final verification. Reuse the existing App Router, theme provider, and page structure rather than introducing new IA or a new theming system.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, Base UI, lucide-react, date-fns, Vitest, ESLint

---

## Execution Prerequisites

- [ ] Create a dedicated worktree before touching code so the existing dirty worktree is left alone.

```bash
git worktree add ../life-tracking-app-hybrid-ui -b codex/hybrid-ui-polish
cd ../life-tracking-app-hybrid-ui
```

Expected: a new checkout on branch `codex/hybrid-ui-polish`.

- [ ] Read the local Next.js docs that matter for metadata and layout changes before editing `app/layout.tsx`.

```bash
sed -n '1,220p' node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/index.md
sed -n '1,220p' node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md
```

Expected: confirm the supported `Metadata` / `Viewport` exports and the current App Router layout conventions in Next 16.

- [ ] Keep the approved spec open while implementing.

```bash
sed -n '1,260p' docs/superpowers/specs/2026-04-22-hybrid-ui-light-dark-design.md
```

Expected: the implementation stays anchored to the approved scope and does not drift into a brand reset or IA rewrite.

## File Structure

### Create
- `docs/superpowers/plans/2026-04-22-hybrid-ui-light-dark-implementation.md` — this implementation plan
- `lib/theme-meta.ts` — shared light/dark browser chrome colors for metadata and viewport exports
- `lib/theme-meta.test.ts` — unit coverage for theme metadata constants
- `components/ui/button.test.ts` — verifies shared button chrome variants match the new operator/editorial split
- `components/layout/Sidebar.test.tsx` — verifies active navigation semantics for the polished shell
- `components/layout/TopBar.test.tsx` — verifies the new page-header wrapper and quick-action rendering
- `components/today/TodayHeader.test.tsx` — verifies the upgraded summary structure and accessibility hooks
- `components/habits/HabitCard.test.tsx` — verifies alert/status semantics for operator cards
- `components/calendar/DayView.test.tsx` — verifies agenda structure and quick-complete affordance on dense calendar views
- `components/goals/GoalCard.test.tsx` — verifies accessible open/edit controls for the goals card chrome

### Modify
- `app/layout.tsx` — export `viewport` and apply theme-color metadata from shared constants
- `app/(app)/layout.tsx` — tune the app shell background and main-column frame
- `app/globals.css` — refine theme tokens, surface/elevation utilities, operator/editorial utilities, and motion helpers
- `vitest.config.ts` — add root alias resolution so component tests can import files that use `@/`
- `components/ui/button.tsx` — sharpen the distinction between default, outline, ghost, and dense utility chrome
- `components/ui/input.tsx` — align input surfaces with the refined light/dark elevation system
- `components/ui/dialog.tsx` — give dialogs a stronger overlay/elevation treatment in both themes
- `components/layout/Sidebar.tsx` — polish the frame and add better active-route semantics
- `components/layout/TopBar.tsx` — establish the shared editorial page-header wrapper
- `components/theme/ThemeToggle.tsx` — align toggle chrome with the shell and maintain hydration-safe behavior
- `app/(app)/today/page.tsx` — restructure `Today` into a benchmark page with a dominant primary surface and quieter secondary surfaces
- `components/today/TodayHeader.tsx` — make the date hero and summary metrics more deliberate
- `components/today/TodayHabitList.tsx` — make habits the primary action surface with stronger grouping
- `components/today/TodayGoalSnapshot.tsx` — quiet, compact supporting panel
- `app/(app)/habits/page.tsx` — tighten page rhythm and empty/loading states
- `components/habits/HabitCard.tsx` — compress status/metrics/actions into an operator-friendly card
- `app/(app)/calendar/page.tsx` — sharpen toolbar density and view switching
- `components/calendar/WeekView.tsx` — improve header contrast, drop-target clarity, and dense grid chrome
- `components/calendar/DayView.tsx` — improve agenda density and supporting semantics
- `components/calendar/MonthView.tsx` — align month cells with the refined calendar chrome
- `components/calendar/RightDrawer.tsx` — elevate the drawer as a first-class operator panel
- `app/(app)/goals/page.tsx` — align page density and example/empty-state presentation
- `components/goals/GoalCard.tsx` — improve card chrome and separate open/edit interactions accessibly
- `app/(app)/analytics/page.tsx` — improve KPI grouping, chart framing, and loading-state structure

## Task 1: Browser Theme Metadata Foundation

**Files:**
- Create: `lib/theme-meta.ts`
- Create: `lib/theme-meta.test.ts`
- Modify: `app/layout.tsx`
- Reference: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/index.md`

- [ ] **Step 1: Write the failing test for theme metadata constants**

```ts
import { describe, expect, it } from "vitest";

import { DARK_THEME_COLOR, LIGHT_THEME_COLOR } from "./theme-meta";

describe("theme meta colors", () => {
  it("exports stable browser chrome colors for both themes", () => {
    expect(LIGHT_THEME_COLOR).toBe("#f4efe4");
    expect(DARK_THEME_COLOR).toBe("#151515");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/theme-meta.test.ts`

Expected: FAIL with `Cannot find module './theme-meta'` or an equivalent missing-import error.

- [ ] **Step 3: Implement the shared theme metadata helper and wire it into the root layout**

`lib/theme-meta.ts`

```ts
export const LIGHT_THEME_COLOR = "#f4efe4";
export const DARK_THEME_COLOR = "#151515";
```

`app/layout.tsx`

```tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider, themeBootScript } from "@/components/theme/ThemeProvider";
import { DARK_THEME_COLOR, LIGHT_THEME_COLOR } from "@/lib/theme-meta";

export const metadata: Metadata = {
  title: "Trackr — a quieter way to track your life",
  description:
    "A calm, focused companion for habits, goals and the days that make them. Built around intentional daily rhythm.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: LIGHT_THEME_COLOR },
    { media: "(prefers-color-scheme: dark)", color: DARK_THEME_COLOR },
  ],
};
```

- [ ] **Step 4: Run the targeted test again**

Run: `npx vitest run lib/theme-meta.test.ts`

Expected: PASS with `1 passed`.

- [ ] **Step 5: Commit the metadata foundation**

```bash
git add app/layout.tsx lib/theme-meta.ts lib/theme-meta.test.ts
git commit -m "feat: add browser theme metadata"
```

## Task 2: Theme Tokens And Shared Chrome Primitives

**Files:**
- Modify: `app/globals.css`
- Modify: `components/ui/button.tsx`
- Modify: `components/ui/input.tsx`
- Modify: `components/ui/dialog.tsx`
- Create: `components/ui/button.test.ts`

- [ ] **Step 1: Write the failing button variant test**

```ts
import { describe, expect, it } from "vitest";

import { buttonVariants } from "./button";

describe("buttonVariants", () => {
  it("uses surface-backed outline chrome for dense operator controls", () => {
    const classes = buttonVariants({ variant: "outline", size: "sm" });

    expect(classes).toContain("bg-surface");
    expect(classes).toContain("hover:border-hairline-strong");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/ui/button.test.ts`

Expected: FAIL because the current outline variant still uses `bg-background` and does not include the stronger hover border class.

- [ ] **Step 3: Refine the shared tokens and primitive chrome**

`app/globals.css`

```css
@theme inline {
  --color-surface-operator: var(--surface-operator);
  --color-shell: var(--shell);
}

:root {
  --surface-elevated: oklch(0.995 0.003 85);
  --surface-operator: oklch(0.985 0.004 85);
  --shell: oklch(0.978 0.004 85);
  --shadow-soft: 0 1px 0 rgba(10, 10, 10, 0.04), 0 10px 24px rgba(10, 10, 10, 0.06);
  --shadow-lifted: 0 1px 0 rgba(10, 10, 10, 0.05), 0 18px 44px -18px rgba(10, 10, 10, 0.18);
}

.dark {
  --surface-elevated: oklch(0.215 0.007 270);
  --surface-operator: oklch(0.195 0.008 270);
  --shell: oklch(0.16 0.006 270);
}

@layer utilities {
  .surface-operator {
    background: var(--surface-operator);
    border: 1px solid var(--hairline);
    border-radius: var(--radius-lg);
  }

  .surface-shell {
    background: var(--shell);
    border-color: var(--hairline);
  }
}
```

`components/ui/button.tsx`

```ts
outline:
  "border-hairline bg-surface text-ink-muted shadow-[var(--shadow-soft)] hover:border-hairline-strong hover:bg-surface-elevated hover:text-ink aria-expanded:border-hairline-strong aria-expanded:bg-surface-elevated",
ghost:
  "text-ink-muted hover:bg-accent hover:text-ink aria-expanded:bg-accent aria-expanded:text-ink",
```

`components/ui/input.tsx`

```ts
"h-8 w-full min-w-0 rounded-lg border border-hairline bg-surface px-2.5 py-1 text-base text-ink transition-[border-color,box-shadow,background-color,color] outline-none placeholder:text-ink-subtle focus-visible:border-hairline-strong focus-visible:ring-3 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-operator disabled:text-ink-subtle disabled:opacity-100 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
```

`components/ui/dialog.tsx`

```tsx
<DialogPrimitive.Backdrop
  data-slot="dialog-overlay"
  className={cn(
    "fixed inset-0 isolate z-50 bg-black/18 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 dark:bg-black/42",
    className
  )}
  {...props}
/>

<DialogPrimitive.Popup
  data-slot="dialog-content"
  className={cn(
    "surface-card-elevated fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 p-4 text-sm text-popover-foreground shadow-[var(--shadow-lifted)] outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
    className
  )}
  {...props}
>
```

- [ ] **Step 4: Run the primitive test and the repo lint pass**

Run: `npx vitest run components/ui/button.test.ts && npm run lint`

Expected: the button test passes and ESLint exits cleanly.

- [ ] **Step 5: Commit the token and primitive pass**

```bash
git add app/globals.css components/ui/button.tsx components/ui/button.test.ts components/ui/input.tsx components/ui/dialog.tsx
git commit -m "feat: refine ui theme tokens and primitives"
```

## Task 3: Shell Polish And Component Test Harness

**Files:**
- Modify: `vitest.config.ts`
- Modify: `app/(app)/layout.tsx`
- Modify: `components/layout/Sidebar.tsx`
- Modify: `components/layout/TopBar.tsx`
- Modify: `components/theme/ThemeToggle.tsx`
- Create: `components/layout/Sidebar.test.tsx`
- Create: `components/layout/TopBar.test.tsx`

- [ ] **Step 1: Write the failing shell component tests**

`components/layout/TopBar.test.tsx`

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TopBar } from "./TopBar";

describe("TopBar", () => {
  it("renders the page-header wrapper and quick action", () => {
    const html = renderToStaticMarkup(
      <TopBar
        title="Today"
        eyebrow="Overview"
        subtitle="Your rhythm, goals and the small wins that compound."
        onQuickAdd={() => {}}
        quickAddLabel="New habit"
      />,
    );

    expect(html).toContain('data-slot="page-header"');
    expect(html).toContain("New habit");
  });
});
```

`components/layout/Sidebar.test.tsx`

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/today",
}));

vi.mock("@/components/theme/ThemeToggle", () => ({
  ThemeToggle: () => <div>Theme toggle</div>,
}));

vi.mock("@/components/layout/UserAccountButton", () => ({
  UserAccountButton: () => <div>Account button</div>,
}));

import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("marks the active route with aria-current", () => {
    const html = renderToStaticMarkup(<Sidebar />);

    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Workspace");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run components/layout/TopBar.test.tsx components/layout/Sidebar.test.tsx`

Expected: FAIL with an alias-resolution error for `@/` or with the missing `data-slot="page-header"` / `aria-current="page"` assertions.

- [ ] **Step 3: Add alias resolution and implement the shell polish**

`vitest.config.ts`

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
  test: {
    environment: "node",
    exclude: ["**/node_modules/**"],
  },
});
```

`components/layout/TopBar.tsx`

```tsx
export function TopBar({
  title,
  eyebrow,
  subtitle,
  onQuickAdd,
  quickAddLabel = "New",
  right,
  className,
}: TopBarProps) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "relative flex shrink-0 items-end justify-between gap-6 px-8 pb-6 pt-8",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-hairline" />

      <div className="min-w-0 flex-1">
        {eyebrow && <p className="mb-1.5 text-eyebrow">{eyebrow}</p>}
        <h1 className="text-display-sm truncate text-[30px] text-ink">{title}</h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink-muted">{subtitle}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {right}
        {onQuickAdd && (
          <Button size="sm" onClick={onQuickAdd} className="gap-1.5 shadow-[var(--shadow-soft)]">
            <Plus className="h-4 w-4" />
            {quickAddLabel}
          </Button>
        )}
      </div>
    </header>
  );
}
```

`components/layout/Sidebar.tsx`

```tsx
<aside className="surface-shell relative flex h-screen w-64 flex-col border-r px-4 py-5 supports-backdrop-filter:backdrop-blur-xl">
  <Link href="/today" className="group/brand mb-10 flex items-baseline gap-px px-2 select-none">
    <span className="text-[17px] font-medium tracking-[-0.02em] text-ink">trackr</span>
    <span className="h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-ember transition-chrome group-hover/brand:scale-125" />
  </Link>

  <p className="mb-2 px-3 text-eyebrow">Workspace</p>

  <nav className="flex flex-col gap-1">
    {nav.map(({ href, label, icon: Icon }) => {
      const active = pathname.startsWith(href);

      return (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "group/navitem relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-chrome",
            active
              ? "bg-surface text-ink shadow-[var(--shadow-soft)]"
              : "text-ink-muted hover:bg-surface hover:text-ink",
          )}
        >
```

`components/theme/ThemeToggle.tsx`

```tsx
className={cn(
  "group relative inline-flex items-center justify-center rounded-full border transition-chrome focus-visible:border-hairline-strong",
  "border-hairline bg-surface-elevated text-ink-muted shadow-[var(--shadow-soft)] hover:text-ink hover:border-hairline-strong",
  size === "md" ? "h-9 w-9" : "h-8 w-8",
  className,
)}
```

`app/(app)/layout.tsx`

```tsx
<div className="flex h-screen overflow-hidden bg-background text-foreground">
  <Sidebar />
  <main className="relative flex flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(230,152,74,0.08),transparent_28%),linear-gradient(180deg,var(--background),var(--background))]">
    {children}
  </main>
  <Toaster
    position="bottom-right"
    toastOptions={{
      className:
        "!bg-surface-elevated !text-ink !border !border-hairline !shadow-[var(--shadow-lifted)]",
    }}
  />
</div>
```

- [ ] **Step 4: Run the shell tests and repo lint pass**

Run: `npx vitest run components/layout/TopBar.test.tsx components/layout/Sidebar.test.tsx && npm run lint`

Expected: both component tests pass and ESLint exits cleanly.

- [ ] **Step 5: Commit the shell layer**

```bash
git add vitest.config.ts app/'(app)'/layout.tsx components/layout/Sidebar.tsx components/layout/Sidebar.test.tsx components/layout/TopBar.tsx components/layout/TopBar.test.tsx components/theme/ThemeToggle.tsx
git commit -m "feat: polish app shell chrome"
```

## Task 4: Make Today The Benchmark Page

**Files:**
- Modify: `app/(app)/today/page.tsx`
- Modify: `components/today/TodayHeader.tsx`
- Modify: `components/today/TodayHabitList.tsx`
- Modify: `components/today/TodayGoalSnapshot.tsx`
- Create: `components/today/TodayHeader.test.tsx`

- [ ] **Step 1: Write the failing Today header test**

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TodayHeader } from "./TodayHeader";

describe("TodayHeader", () => {
  it("renders an accessible daily summary region", () => {
    const html = renderToStaticMarkup(
      <TodayHeader
        today="2026-04-22"
        totalHabits={7}
        completedHabits={5}
        habitsWithActiveStreak={3}
      />,
    );

    expect(html).toContain('aria-label="Daily summary"');
    expect(html).toContain("Completion");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/today/TodayHeader.test.tsx`

Expected: FAIL because the current header does not yet expose the new labeled summary region.

- [ ] **Step 3: Rebuild Today around one dominant action surface and two quieter secondary surfaces**

`components/today/TodayHeader.tsx`

```tsx
return (
  <section className="border-b border-hairline pb-12">
    <p className="text-eyebrow">{format(date, "EEEE")}</p>
    <h2 className="text-display mt-4 text-[76px] text-ink">
      {format(date, "MMMM d")}
      <span className="text-ink-subtle">.</span>
    </h2>
    <p className="mt-4 max-w-xl text-[14px] leading-6 text-ink-muted">{nudge}</p>

    <div
      aria-label="Daily summary"
      className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      <Metric label="Completed" value={`${completedHabits}`} suffix={` / ${totalHabits}`} />
      <Metric label="Completion" value={`${completionRate}`} suffix="%" />
      <Metric label="Active streaks" value={`${habitsWithActiveStreak}`} accent={habitsWithActiveStreak > 0} />
    </div>
  </section>
);
```

`app/(app)/today/page.tsx`

```tsx
if (loading) {
  return (
    <div className="flex-1 p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-44 animate-pulse rounded-[28px] bg-surface" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
          <div className="h-[28rem] animate-pulse rounded-[24px] bg-surface" />
          <div className="space-y-6">
            <div className="h-44 animate-pulse rounded-[24px] bg-surface" />
            <div className="h-52 animate-pulse rounded-[24px] bg-surface" />
          </div>
        </div>
      </div>
    </div>
  );
}

return (
  <>
    <TopBar title="Today" eyebrow="Overview" subtitle="Your rhythm, goals and the small wins that compound." />
    <div className="scroll-seamless flex-1">
      <div className="mx-auto max-w-5xl px-8 pb-24 pt-12">
        <TodayHeader
          today={today}
          totalHabits={snapshot.summary.totalHabits}
          completedHabits={snapshot.summary.completedHabits}
          habitsWithActiveStreak={snapshot.summary.habitsWithActiveStreak}
        />

        <div className="mt-14 grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
          <section className="surface-card-elevated p-6">
            <TodayHabitList
              groups={snapshot.habitGroups}
              busyHabitId={busyHabitId}
              onQuickComplete={(habitId) => void handleQuickComplete(habitId)}
              onQuickLog={setLoggingHabitId}
            />
          </section>

          <div className="space-y-6">
            <section className="surface-card p-5">
              <div className="mb-5 flex items-baseline justify-between">
                <h3 className="text-display-sm text-[20px] text-ink">Todos</h3>
                <span className="text-eyebrow">Today</span>
              </div>

              {snapshot.todosToday.length === 0 ? (
                <p className="text-[13px] text-ink-subtle">Nothing on the list.</p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {snapshot.todosToday.map((todo) => (
                    <li key={todo.id} className="flex items-center justify-between gap-3 py-3">
                      <p className="truncate text-[14px] text-ink">{todo.title}</p>
                      <span className="text-eyebrow">{todo.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="surface-card p-5">
              <TodayGoalSnapshot goalProgress={snapshot.goalProgress} />
            </section>
          </div>
        </div>
      </div>
    </div>
  </>
);
```

`components/today/TodayHabitList.tsx`

```tsx
<section>
  <div className="mb-6 flex items-baseline justify-between">
    <h3 className="text-display-sm text-[24px] text-ink">Habits</h3>
    <span className="text-eyebrow">Primary surface</span>
  </div>

  <div className="space-y-8">
    {Object.entries(groups).map(([key, rows]) => {
      if (rows.length === 0) return null;

      return (
        <div key={key}>
          <p className="mb-3 text-eyebrow">{sectionTitle[key]}</p>
          <ul className="divide-y divide-hairline">
```

`components/today/TodayGoalSnapshot.tsx`

```tsx
<section>
  <div className="mb-5 flex items-baseline justify-between">
    <h3 className="text-display-sm text-[20px] text-ink">Goals</h3>
    <span className="text-eyebrow">Impact today</span>
  </div>
```

- [ ] **Step 4: Run the Today test and lint**

Run: `npx vitest run components/today/TodayHeader.test.tsx && npm run lint`

Expected: the Today header test passes and the repo remains lint-clean.

- [ ] **Step 5: Commit the Today benchmark pass**

```bash
git add app/'(app)'/today/page.tsx components/today/TodayHeader.tsx components/today/TodayHeader.test.tsx components/today/TodayHabitList.tsx components/today/TodayGoalSnapshot.tsx
git commit -m "feat: elevate today page hierarchy"
```

## Task 5: Convert Habits Into An Operator Surface

**Files:**
- Modify: `app/(app)/habits/page.tsx`
- Modify: `components/habits/HabitCard.tsx`
- Modify: `components/habits/HabitHeatmap.tsx`
- Create: `components/habits/HabitCard.test.tsx`

- [ ] **Step 1: Write the failing HabitCard semantics test**

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HabitCard } from "./HabitCard";
import type { Habit } from "@/lib/types";

const habit: Habit = {
  id: "habit-1",
  title: "Read 30 pages",
  tracking_type: "boolean",
  recurrence_type: "daily",
  recurrence_config: {},
  auto_create_calendar_instances: true,
  is_active: true,
  is_paused: false,
  unit: null,
  cue_time: null,
  cue_context: null,
  cue_location: null,
  identity_statement: null,
  created_at: "",
  updated_at: "",
};

describe("HabitCard", () => {
  it("marks alertful cards with data-alert and keeps utility actions visible", () => {
    const html = renderToStaticMarkup(
      <HabitCard
        habit={habit}
        status="due"
        currentStreak={0}
        missedYesterday
        completionRate30d={62}
        linkedGoalTitles={["Read more books"]}
        onQuickComplete={() => {}}
        onTogglePause={() => {}}
      />,
    );

    expect(html).toContain('data-alert="true"');
    expect(html).toContain("Pause");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/habits/HabitCard.test.tsx`

Expected: FAIL because `HabitCard` does not yet emit the `data-alert` hook.

- [ ] **Step 3: Compress the habit card into a denser, status-first operator layout**

`components/habits/HabitCard.tsx`

```tsx
return (
  <div
    data-status={status}
    data-alert={hasAlert ? "true" : undefined}
    className={cn(
      "group/card flex w-full flex-col rounded-2xl border bg-surface p-4 transition-chrome",
      celebrate ? "border-ember bg-ember-soft" : hasAlert ? "border-ember/60" : "border-hairline",
      "hover:border-hairline-strong hover:shadow-[var(--shadow-soft)]",
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-eyebrow">{statusLabel[status]}</p>
        <p className="mt-1 truncate text-[14.5px] font-medium text-ink">{habit.title}</p>
        <p className="mt-0.5 truncate text-[11.5px] text-ink-subtle">
          {recurrenceLabel[habit.recurrence_type]} · {habit.tracking_type}
          {habit.unit ? ` (${habit.unit})` : ""}
        </p>
      </div>

      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(e);
          }}
          className="rounded-lg p-1.5 text-ink-subtle transition-chrome hover:bg-accent hover:text-ink"
        >
          <Pencil size={14} />
        </button>
      )}
    </div>

    <div className="mt-4 grid grid-cols-2 gap-2">
      <div className="surface-operator px-3 py-2">
        <p className="text-eyebrow">Streak</p>
        <p className="mt-2 text-metric text-[20px] text-ink">{currentStreak}</p>
      </div>
      <div className="surface-operator px-3 py-2">
        <p className="text-eyebrow">30d rate</p>
        <p className="mt-2 text-metric text-[20px] text-ink">{completionRate30d}%</p>
      </div>
    </div>
```

`app/(app)/habits/page.tsx`

```tsx
<div className="flex-1 overflow-y-auto scroll-seamless">
  <div className="mx-auto max-w-6xl px-8 py-8">
    {habits.length === 0 ? (
      <div className="surface-card flex flex-col items-center justify-center gap-6 py-16 text-center">
        <p className="text-sm text-ink-subtle">No habits yet.</p>
        <div className="surface-operator w-full max-w-3xl p-5 text-left">
          <p className="mb-3 text-eyebrow">Example habit ideas</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {habitExamples.map((example) => (
              <div key={example.title} className="rounded-xl border border-hairline bg-surface p-3">
                <p className="text-[13px] font-medium text-ink">{example.title}</p>
                <p className="mt-1 text-[11px] text-ink-subtle">{example.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : (
      <div className="space-y-10">
        {grouped.sections.map((section) => (
          <section key={section.goal.id} className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-hairline pb-2">
              <h2 className="text-eyebrow">{section.goal.title}</h2>
              <span className="text-metric text-[11px] text-ink-subtle">
                {section.habits.length} habit{section.habits.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {section.habits.map((habit) => renderHabitTile(habit))}
            </div>
          </section>
        ))}

        {grouped.unlinked.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-hairline pb-2">
              <h2 className="text-eyebrow">Unlinked habits</h2>
              <span className="text-metric text-[11px] text-ink-subtle">{grouped.unlinked.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {grouped.unlinked.map((habit) => renderHabitTile(habit))}
            </div>
          </section>
        )}
      </div>
    )}
  </div>
</div>
```

`components/habits/HabitHeatmap.tsx`

```tsx
return (
  <div className="mt-3 surface-operator p-3">
    <p className="mb-2 text-eyebrow">Last 12 weeks</p>
    <div className="flex gap-1 overflow-x-auto pb-1">
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-rows-7 gap-1">
          {week.map((cell) => (
            <div
              key={cell.date}
              className={`h-2.5 w-2.5 rounded-[3px] ${cellColor[cell.status]}`}
              title={tooltipText(cell)}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);
```

- [ ] **Step 4: Run the habits test and lint**

Run: `npx vitest run components/habits/HabitCard.test.tsx && npm run lint`

Expected: the new semantics test passes and the repo remains lint-clean.

- [ ] **Step 5: Commit the habits operator pass**

```bash
git add app/'(app)'/habits/page.tsx components/habits/HabitCard.tsx components/habits/HabitCard.test.tsx components/habits/HabitHeatmap.tsx
git commit -m "feat: tighten habits operator surfaces"
```

## Task 6: Sharpen Calendar Density And Drawer Elevation

**Files:**
- Modify: `app/(app)/calendar/page.tsx`
- Modify: `components/calendar/WeekView.tsx`
- Modify: `components/calendar/DayView.tsx`
- Modify: `components/calendar/MonthView.tsx`
- Modify: `components/calendar/RightDrawer.tsx`
- Create: `components/calendar/DayView.test.tsx`

- [ ] **Step 1: Write the failing DayView accessibility/agenda test**

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DayView } from "./DayView";
import type { CalendarItem } from "@/lib/types";

const item: CalendarItem = {
  id: "todo-1",
  title: "Deep work block",
  start_datetime: "2026-04-22T09:00:00",
  end_datetime: "2026-04-22T10:30:00",
  all_day: false,
  kind: "todo",
  status: "pending",
  requires_numeric_log: false,
  source_habit_id: null,
};

describe("DayView", () => {
  it("renders a labeled day agenda surface", () => {
    const html = renderToStaticMarkup(
      <DayView
        date={new Date("2026-04-22T12:00:00")}
        items={[item]}
        onItemClick={() => {}}
        onQuickComplete={() => {}}
      />,
    );

    expect(html).toContain('aria-label="Day agenda"');
    expect(html).toContain("Quick complete");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/calendar/DayView.test.tsx`

Expected: FAIL because the current day view does not yet carry the labeled agenda wrapper.

- [ ] **Step 3: Make calendar controls denser and more tool-like**

`app/(app)/calendar/page.tsx`

```tsx
<header className="surface-shell flex h-16 shrink-0 items-center justify-between border-b px-6">
  <div className="flex items-center gap-1.5">
    <Button variant="outline" size="icon-sm" onClick={calendar.goToPrevPeriod} className="text-ink-muted hover:text-ink">
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <Button variant="outline" size="icon-sm" onClick={calendar.goToNextPeriod} className="text-ink-muted hover:text-ink">
      <ChevronRight className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="sm" onClick={calendar.goToToday} className="text-ink-muted hover:text-ink">
      Today
    </Button>
    <span className="ml-3 text-metric text-[13px] font-medium text-ink">{dateLabel}</span>
  </div>

  <div className="surface-operator flex items-center gap-1 rounded-full p-1">
    {(["week", "day", "month"] as const).map((v) => (
      <button
        key={v}
        type="button"
        aria-pressed={view === v}
        onClick={() => setView(v)}
        className={cn(
          "rounded-full px-3 py-1.5 text-[11.5px] font-medium capitalize transition-chrome",
          view === v ? "bg-ink text-background shadow-[var(--shadow-soft)]" : "text-ink-muted hover:text-ink",
        )}
      >
        {v}
      </button>
    ))}
  </div>
</header>
```

`components/calendar/DayView.tsx`

```tsx
return (
  <div aria-label="Day agenda" className="flex flex-1 flex-col gap-4 overflow-y-auto bg-background p-8">
    <div>
      <p className="text-eyebrow">{format(date, "EEEE")}</p>
      <h2 className="text-display-sm mt-1 text-[28px] text-ink">{format(date, "MMMM d")}</h2>
    </div>
```

`components/calendar/WeekView.tsx`

```tsx
className="sticky top-0 z-10 flex h-12 w-full flex-col items-center justify-center border-b border-r border-hairline bg-background/92 transition-chrome supports-backdrop-filter:backdrop-blur-sm hover:bg-surface"
```

`components/calendar/RightDrawer.tsx`

```tsx
<aside className="surface-card-elevated flex h-full w-[360px] flex-col border-l shadow-[var(--shadow-lifted)]">
```

`components/calendar/MonthView.tsx`

```tsx
"min-h-32 surface-operator p-2 text-left align-top transition-chrome hover:border-hairline-strong"
```

- [ ] **Step 4: Run the calendar test and lint**

Run: `npx vitest run components/calendar/DayView.test.tsx && npm run lint`

Expected: the day-view test passes and the repo remains lint-clean.

- [ ] **Step 5: Commit the calendar pass**

```bash
git add app/'(app)'/calendar/page.tsx components/calendar/WeekView.tsx components/calendar/DayView.tsx components/calendar/DayView.test.tsx components/calendar/MonthView.tsx components/calendar/RightDrawer.tsx
git commit -m "feat: sharpen calendar operator chrome"
```

## Task 7: Align Goals, Analytics, And Secondary States

**Files:**
- Modify: `app/(app)/goals/page.tsx`
- Modify: `components/goals/GoalCard.tsx`
- Modify: `app/(app)/analytics/page.tsx`
- Create: `components/goals/GoalCard.test.tsx`

- [ ] **Step 1: Write the failing GoalCard accessibility test**

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GoalCard } from "./GoalCard";
import type { GoalProgress } from "@/lib/types";

const progress: GoalProgress = {
  goal: {
    id: "goal-1",
    title: "Read 500 pages",
    goal_type: "accumulation",
    unit: "pages",
    target_value: 500,
    start_date: "2026-04-01",
    end_date: "2026-04-30",
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  current_value: 220,
  percentage: 44,
  is_on_track: true,
};

describe("GoalCard", () => {
  it("exposes accessible open and edit controls", () => {
    const html = renderToStaticMarkup(
      <GoalCard progress={progress} onClick={() => {}} onEdit={() => {}} />,
    );

    expect(html).toContain('aria-label="Open goal Read 500 pages"');
    expect(html).toContain('aria-label="Edit goal Read 500 pages"');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/goals/GoalCard.test.tsx`

Expected: FAIL because the current card does not expose those labels and still uses an awkward nested interaction pattern.

- [ ] **Step 3: Separate open/edit interactions and tighten the supporting pages**

`components/goals/GoalCard.tsx`

```tsx
export function GoalCard({ progress, onClick, onEdit }: GoalCardProps) {
  const { goal, current_value, percentage, is_on_track } = progress;

  return (
    <article className="group/card relative rounded-2xl border border-hairline bg-surface p-5 text-left transition-chrome hover:border-hairline-strong hover:shadow-[var(--shadow-soft)]">
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open goal ${goal.title}`}
        className="absolute inset-0 rounded-2xl"
      />

      <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-eyebrow">{typeLabel[goal.goal_type]}</p>
          <p className="mt-1 truncate text-[15px] font-medium text-ink">{goal.title}</p>
          <p className="text-metric mt-0.5 text-[11px] text-ink-subtle">
            {format(parseISO(goal.start_date), "MMM d")} — {format(parseISO(goal.end_date), "MMM d, yyyy")}
          </p>
        </div>

        {onEdit && (
          <button
            type="button"
            aria-label={`Edit goal ${goal.title}`}
            onClick={onEdit}
            className="rounded-lg p-1.5 text-ink-subtle transition-chrome hover:bg-accent hover:text-ink"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>
```

`app/(app)/goals/page.tsx`

```tsx
{goals.length === 0 ? (
  <div className="surface-card flex flex-col items-center justify-center gap-6 py-16 text-center">
    <p className="text-sm text-ink-subtle">No goals yet. Create your first.</p>
    <div className="surface-operator w-full max-w-3xl p-5 text-left">
      <p className="mb-3 text-eyebrow">Example goal ideas</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {goalExamples.map((example) => (
          <div key={example.title} className="rounded-xl border border-hairline bg-surface p-3">
            <p className="text-[13px] font-medium text-ink">{example.title}</p>
            <p className="mt-1 text-[11px] text-ink-subtle">{example.details}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
) : (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {progressList.map((p) => (
      <GoalCard
        key={p.goal.id}
        progress={p}
        onClick={() => router.push(`/goals/${p.goal.id}`)}
        onEdit={() => setEditingGoalId(p.goal.id)}
      />
    ))}
  </div>
)}
```

`app/(app)/analytics/page.tsx`

```tsx
<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
  <div className="surface-operator px-5 py-4">
    <p className="text-eyebrow">Active goals</p>
    <p className="text-display-sm mt-1 text-[28px] text-ink">{snapshot.totals.totalGoals}</p>
  </div>
  <div className="surface-operator px-5 py-4">
    <p className="text-eyebrow">On track</p>
    <p className="text-display-sm mt-1 text-[28px] text-ink">
      {snapshot.totals.onTrackGoals}
      <span className="ml-1 text-[14px] text-ink-subtle">/ {snapshot.totals.totalGoals}</span>
    </p>
  </div>
  <div className="surface-operator px-5 py-4">
    <p className="text-eyebrow">Todo completion</p>
    <p className="text-display-sm mt-1 text-[28px] text-ink">
      {snapshot.totals.todoCompletionRate}
      <span className="text-[14px] text-ink-subtle">%</span>
    </p>
  </div>
  <div className="surface-operator px-5 py-4">
    <p className="text-eyebrow">Logs · 14d</p>
    <p className="text-display-sm mt-1 text-[28px] text-ink">{snapshot.totals.logsInWindow}</p>
  </div>
</div>

<div className="surface-card-elevated p-5">
  <div className="mb-4 flex items-baseline justify-between">
    <p className="text-eyebrow">Daily logged values</p>
    <p className="text-[11px] text-ink-subtle">Last 14 days</p>
  </div>
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={snapshot.dailyLogSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="seriesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent-ember)" stopOpacity={0.22} />
            <stop offset="95%" stopColor="var(--accent-ember)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => format(parseISO(value), "MMM d")}
          tick={{ fill: "var(--ink-subtle)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--surface-elevated)",
            border: "1px solid var(--hairline)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--ink)",
          }}
        />
        <Area type="monotone" dataKey="total" stroke="var(--accent-ember)" fill="url(#seriesFill)" strokeWidth={1.75} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
</div>
```

- [ ] **Step 4: Run the goals test and the full verification commands**

Run: `npx vitest run components/goals/GoalCard.test.tsx && npm run test && npm run lint && npm run build`

Expected:
- GoalCard test passes
- `npm run test` passes across the repo
- `npm run lint` exits cleanly
- `npm run build` succeeds

- [ ] **Step 5: Commit the secondary-page alignment pass**

```bash
git add app/'(app)'/goals/page.tsx app/'(app)'/analytics/page.tsx components/goals/GoalCard.tsx components/goals/GoalCard.test.tsx
git commit -m "feat: align goals and analytics chrome"
```

## Task 8: Manual QA And Finish Criteria

**Files:**
- Modify only if a final polish fix is needed after QA

- [ ] **Step 1: Run the app locally for visual verification**

Run: `npm run dev`

Expected: the app boots locally and the top-level routes render without runtime errors.

- [ ] **Step 2: Verify the approved page hierarchy**

Check manually:
- `Today` feels more spacious and editorial than the rest of the app
- `Habits` feels denser and faster to scan than `Today`
- `Calendar` toolbar, headers, and drawer feel sharper and more operational
- `Goals` and `Analytics` sit between the emotional anchor and the operator surfaces

- [ ] **Step 3: Verify theme behavior manually**

Check manually:
- Toggle between light and dark from the sidebar
- Confirm no flash of the wrong theme on refresh
- Confirm dialogs, drawer surfaces, segmented controls, and dense calendar regions remain legible in dark mode
- Confirm browser chrome reflects the active theme on refresh

- [ ] **Step 4: Verify responsive behavior manually**

Check manually:
- Narrow mobile-width viewport
- Laptop width
- Ultra-wide / 50% zoom simulation

Expected: spacing and grouping remain deliberate at all three sizes.

- [ ] **Step 5: Commit any final QA-only polish**

```bash
git status --short
```

Expected: if QA produced no further edits, stop here. If QA did produce follow-up changes, stage only those explicit paths and commit them with `git commit -m "chore: finalize hybrid ui polish"`.
