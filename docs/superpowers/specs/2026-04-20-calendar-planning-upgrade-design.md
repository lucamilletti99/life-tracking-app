# Calendar Planning Upgrade — Design Spec
**Date:** 2026-04-20
**Status:** Approved

## Problem

The weekly calendar is hard to use for actual planning. Column headers are inert, so there's no way to see at a glance how loaded each day is. The RightDrawer only opens for individual items, so there's no day-level overview showing what's pending, what's done, or which goals are in play that day. Rescheduling todos requires deleting and recreating them.

## Scope

- **A (core):** Day load indicators on column headers + day-mode RightDrawer
- **B (stretch):** Drag-and-drop rescheduling for todos

---

## Architecture

### Drawer state generalization

The calendar page currently holds `selectedItem: CalendarItem | null`. Replace with a union:

```ts
type DrawerState =
  | { mode: 'item'; item: CalendarItem }
  | { mode: 'day'; date: Date }
  | null
```

`RightDrawer` receives this state and renders the appropriate mode. No new top-level components are created.

### New utility

Add `getDayLoad(items: CalendarItem[], date: Date): 'empty' | 'light' | 'moderate' | 'busy'` to `lib/utils.ts`.

Thresholds:
- `empty` — 0 items
- `light` — 1–2 items
- `moderate` — 3–4 items
- `busy` — 5+ items

### WeekView handler additions

`WeekView` gains `onDayClick: (date: Date) => void` alongside the existing `onItemClick` and `onSlotClick`.

---

## Feature A: Day Load Indicators

Each column header in `WeekView` becomes a clickable button. Below the date number, render a small colored dot based on `getDayLoad`:

| Load level | Dot color |
|---|---|
| empty | none (no dot) |
| light | `sky-400` |
| moderate | `amber-400` |
| busy | `rose-400` |

Clicking anywhere in the column header area fires `onDayClick(date)`. The header gets a subtle hover background (`hover:bg-neutral-50`).

---

## Feature A: Day-Mode Drawer

When `DrawerState.mode === 'day'`, the RightDrawer renders:

**Header:** Formatted date (e.g., "Monday, Apr 21") + completion summary chip ("3 / 5 done").

**Item list:** All `CalendarItem`s for that date, sorted by `start_datetime`. Each row shows:
- Title
- Status badge (pending / complete / skipped)
- For pending items: inline Complete and Skip buttons that call the existing complete/skip logic and fire `onRefresh`
- Clicking the row title switches drawer to item mode for that item (existing behavior)

**Linked goals panel:** Below the item list, a compact section "Goals in play today" listing each goal that has at least one item scheduled that day. Shows goal title + current progress percentage. Goals with no items scheduled that day are omitted.

**Empty state:** If no items exist for the day, show "Nothing scheduled — click a time slot to add."

---

## Feature B: Drag-and-Drop (stretch)

### Library

`@dnd-kit/core` only. No sortable package needed.

### Scope limit

Drag-and-drop applies to **todos only**. Habit occurrences are non-draggable (no drag cursor, no drag handle). Rescheduling habit occurrences would require a habit_occurrences override mechanism that does not exist in the current schema.

### Implementation

- `DndContext` wraps `WeekView` with `onDragEnd`
- Each `CalendarItemChip` for a todo gets `useDraggable({ id: item.id })`
- Each hour-slot `<div>` gets `useDroppable({ id: \`slot-{dateISO}-{hour}\` })`
- `onDragEnd` parses the drop target id → extracts new date and hour → computes new `start_datetime` and `end_datetime` (preserving original duration) → calls `todosService.update` → fires `onRefresh`
- If drop target is null (dropped outside a valid slot), no-op

### Drag overlay

Use `DragOverlay` from `@dnd-kit/core` to render a ghost chip while dragging. Matches the original chip's appearance at reduced opacity.

---

## Out of scope

- Habit occurrence rescheduling
- Cross-week drag (drag target is the current week view only)
- Mobile touch drag support
- Undo/redo for drag operations

---

## Files changed

| File | Change |
|---|---|
| `lib/utils.ts` | Add `getDayLoad` |
| `components/calendar/WeekView.tsx` | Add `onDayClick`, load indicators on headers, `useDraggable` on todo chips, `useDroppable` on slots, `DndContext` wrapper |
| `components/calendar/CalendarItem.tsx` | Accept `draggable` flag; apply `useDraggable` conditionally |
| `components/calendar/RightDrawer.tsx` | Accept `DrawerState` union; add day-mode render branch |
| `app/(app)/calendar/page.tsx` | Replace `selectedItem` state with `DrawerState`; wire `onDayClick` |
| `package.json` | Add `@dnd-kit/core` |
