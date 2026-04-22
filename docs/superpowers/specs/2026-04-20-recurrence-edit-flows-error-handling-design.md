# Design: Recurrence Fix, Edit Flows, Error Handling

**Date:** 2026-04-20  
**Status:** Approved

---

## 1. Recurrence Distribution Fix

### Problem
`times_per_week` and `times_per_month` recurrence types currently select the first N days of the period (e.g., Mon/Tue/Wed for 3x/week). This produces unnatural clustering and doesn't reflect user intent.

### Fix
Use index-based even spacing to distribute occurrences across the period.

**Algorithm:**
- `times_per_week` (N occurrences): divide 7 days by N, select indices `[floor(7*i/N) for i in 0..N-1]` mapped to weekday names. Example: 3x/week → indices 0, 2, 4 → Mon, Wed, Fri.
- `times_per_month` (N occurrences): divide 28 days by N, same modular spacing. Example: 8x/month → days 1, 4, 8, 11, 15, 18, 22, 25.

**File:** `lib/recurrence.ts`

**Tests:** Update existing assertions in `lib/recurrence.test.ts` to match new distribution. No schema or UI changes needed.

---

## 2. Edit Flows

### Entry Points
- `GoalCard.tsx`: Add pencil icon button in card header. Sets `editingId` on parent.
- `HabitCard.tsx`: Same pattern.

### Form Reuse
- `GoalForm.tsx`: Add optional `initialData?: Goal` prop. When present, pre-fill all fields and change modal title to "Edit Goal".
- `HabitForm.tsx`: Add optional `initialData?: Habit` prop. Pre-fills name, tracking type, recurrence config. Title becomes "Edit Habit".

### Auto-Save Behavior
- No explicit save button. Modal has only a close/dismiss action.
- Each field change triggers a debounced (600ms) call to `goalsService.update(id, data)` or `habitsService.update(id, data)`.
- Prevents DB hammering on rapid keystrokes.

### State Management
- Parent pages (`goals/page.tsx`, `habits/page.tsx`) hold an `editingId: string | null` state.
- Setting `editingId` opens the corresponding form modal pre-filled with the matching entity.
- On modal close, `editingId` resets to null and the list re-fetches.

### Files Touched
`GoalForm.tsx`, `HabitForm.tsx`, `GoalCard.tsx`, `HabitCard.tsx`, `app/(app)/goals/page.tsx`, `app/(app)/habits/page.tsx`  
No new files created.

---

## 3. Error Handling / Toasts

### Library
Add `sonner` — single provider, minimal per-call-site boilerplate.

**Install:** `npm install sonner`

### Setup
Add `<Toaster />` to `app/(app)/layout.tsx` to render the toast container globally.

### Pattern
Each Supabase call site in the service layer gets a try/catch:

```ts
try {
  const result = await supabase...
  console.log('[service] operation succeeded', result) // logged, not toasted
  return result
} catch (err) {
  toast.error('Failed to [operation]')
  console.error('[service] operation failed', err)
  throw err // let caller handle UI state
}
```

- **Failures:** Surface as `toast.error(...)` visible to user.
- **Successes:** Logged to `console.log` for internal tracking only.

### Scope
Errors toasted for all mutating operations across:
- `lib/services/goals.ts` — create, update, delete
- `lib/services/habits.ts` — create, update, archive
- `lib/services/todos.ts` — create, update, delete
- `lib/services/logs.ts` — create, delete

### Files Touched
`lib/services/goals.ts`, `lib/services/habits.ts`, `lib/services/todos.ts`, `lib/services/logs.ts`, `app/(app)/layout.tsx`  
No new files. One new dependency (`sonner`).

---

## Out of Scope
- Success toasts (deferred to future session)
- Auth / Row Level Security
- Drag-and-drop calendar rescheduling
- Edit flows for todos or log entries
