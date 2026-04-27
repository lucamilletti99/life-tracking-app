"use client";

import { useEffect, useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { CheckCircle, SkipForward, X } from "lucide-react";

import { useIsMobile } from "@/hooks/useIsMobile";

import { LogForm } from "@/components/logs/LogForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SKIPPED_LOG_NOTE } from "@/lib/habit-status";
import { buildHabitStackCueMap } from "@/lib/habit-stack-insights";
import { habitsService } from "@/lib/services/habits";
import { habitStacksService } from "@/lib/services/habit-stacks";
import { goalsService } from "@/lib/services/goals";
import { getServiceContext } from "@/lib/services/context";
import { logsService } from "@/lib/services/logs";
import { todosService } from "@/lib/services/todos";
import { calculateGoalProgress } from "@/lib/goal-calculations";
import type { CalendarItem, DrawerState, Goal, Habit, LogEntry } from "@/lib/types";

interface RightDrawerProps {
  drawerState: DrawerState;
  allItems: CalendarItem[];
  onClose: () => void;
  onRefresh: () => void;
  onItemSelect: (item: CalendarItem) => void;
}

export function RightDrawer({
  drawerState,
  allItems,
  onClose,
  onRefresh,
  onItemSelect,
}: RightDrawerProps) {
  const isMobile = useIsMobile();

  if (!drawerState) return null;

  // On mobile, render a bottom sheet with a backdrop.
  // On desktop, keep the existing side panel behaviour.
  const content =
    drawerState.mode === "day" ? (
      <DayDrawer
        date={drawerState.date}
        allItems={allItems}
        onClose={onClose}
        onRefresh={onRefresh}
        onItemSelect={onItemSelect}
        isMobile={isMobile}
      />
    ) : (
      <ItemDrawer
        item={drawerState.item}
        onClose={onClose}
        onRefresh={onRefresh}
        isMobile={isMobile}
      />
    );

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
        {/* Bottom sheet */}
        <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
          {content}
        </div>
      </>
    );
  }

  return content;
}

// --- Day Drawer ---

interface DayDrawerProps {
  date: Date;
  allItems: CalendarItem[];
  onClose: () => void;
  onRefresh: () => void;
  onItemSelect: (item: CalendarItem) => void;
  isMobile?: boolean;
}

function DayDrawer({ date, allItems, onClose, onRefresh, onItemSelect, isMobile }: DayDrawerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const dayItems = allItems
    .filter((item) => !item.all_day && isSameDay(parseISO(item.start_datetime), date))
    .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
  const habitLinkedTodos = dayItems.filter(
    (item) => item.kind === "todo" && Boolean(item.source_habit_id),
  );
  // Exclude habit-linked todos from the main list — they already appear in the tile section above.
  const mainListItems = dayItems.filter(
    (item) => !(item.kind === "todo" && Boolean(item.source_habit_id)),
  );

  const completedCount = dayItems.filter((i) => i.status === "complete").length;
  const dateStr = format(date, "yyyy-MM-dd");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const ctx = await getServiceContext();
        const [goalRows, logRows] = await Promise.all([
          goalsService.list(ctx),
          logsService.forDateRange(ctx, dateStr, dateStr),
        ]);
        if (!cancelled) {
          setGoals(goalRows);
          setLogs(logRows);
        }
      } catch {
        // non-critical, leave empty
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [dateStr]);

  async function handleComplete(item: CalendarItem) {
    setSubmitting(item.id);
    try {
      const ctx = await getServiceContext();
      if (item.kind === "todo") {
        await todosService.update(ctx, item.id, { status: "complete" });
      } else if (item.source_habit_id) {
        await logsService.create(ctx, {
          entry_date: dateStr,
          entry_datetime: new Date().toISOString(),
          source_type: "habit",
          source_id: item.source_habit_id,
          numeric_value: 1,
          unit: item.unit,
          note: undefined,
        });
      }
      onRefresh();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(null);
    }
  }

  async function handleSkip(item: CalendarItem) {
    setSubmitting(item.id);
    try {
      const ctx = await getServiceContext();
      if (item.kind === "todo") {
        await todosService.update(ctx, item.id, { status: "skipped" });
      } else if (item.source_habit_id) {
        await logsService.create(ctx, {
          entry_date: dateStr,
          entry_datetime: new Date().toISOString(),
          source_type: "habit",
          source_id: item.source_habit_id,
          numeric_value: 0,
          unit: item.unit,
          note: SKIPPED_LOG_NOTE,
        });
      }
      onRefresh();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(null);
    }
  }

  const sheetClass = isMobile
    ? "surface-card-elevated flex max-h-[80dvh] flex-col rounded-t-2xl border-t border-hairline shadow-[var(--shadow-lifted)] pb-safe"
    : "surface-card-elevated flex h-full w-[360px] flex-col border-l border-hairline shadow-[var(--shadow-lifted)]";

  return (
    <aside className={sheetClass}>
      {/* Drag handle — mobile only */}
      {isMobile && (
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-hairline-strong" aria-hidden />
        </div>
      )}
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div>
          <p className="text-eyebrow">{format(date, "EEEE")}</p>
          <p className="mt-0.5 text-[15px] font-medium text-ink">
            {format(date, "MMMM d")}
          </p>
          {dayItems.length > 0 && (
            <p className="mt-0.5 text-[11px] text-ink-subtle">
              {completedCount} / {dayItems.length} done
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-ink-subtle transition-chrome hover:bg-muted hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 scroll-seamless">
        {habitLinkedTodos.length > 0 && (
          <div>
            <p className="text-eyebrow mb-2">Habit-linked todos</p>
            <div className="grid grid-cols-1 gap-2">
              {habitLinkedTodos.map((item) => (
                <div
                  key={`habit-tile-${item.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-hairline bg-surface px-3 py-2 text-left transition-chrome hover:border-hairline-strong hover:bg-surface-elevated"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => onItemSelect(item)}
                  >
                    <p className="truncate text-[12.5px] text-ink">{item.title}</p>
                    <p className="text-[10.5px] capitalize text-ink-subtle">
                      {item.status}
                      {item.requires_numeric_log && item.unit ? ` · ${item.unit}` : ""}
                    </p>
                  </button>
                  {item.status === "pending" && (
                    <Button
                      size="sm"
                      variant={item.requires_numeric_log ? "outline" : "ghost"}
                      className="h-6 px-2 text-[10.5px]"
                      onClick={() => {
                        if (item.requires_numeric_log) {
                          onItemSelect(item);
                          return;
                        }
                        void handleComplete(item);
                      }}
                      disabled={submitting === item.id}
                    >
                      {submitting === item.id
                        ? "..."
                        : item.requires_numeric_log
                          ? "Add"
                          : "Done"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {dayItems.length === 0 ? (
          <p className="text-sm text-ink-subtle">
            Nothing scheduled — click a time slot to add.
          </p>
        ) : mainListItems.length === 0 ? null : (
          <ul className="divide-y divide-hairline border-y border-hairline">
            {mainListItems.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="text-left text-[13.5px] text-ink transition-chrome hover:text-ember"
                    onClick={() => onItemSelect(item)}
                  >
                    {item.title}
                  </button>
                  <span
                    className={`shrink-0 text-[10px] capitalize ${
                      item.status === "complete"
                        ? "text-ember"
                        : item.status === "skipped"
                          ? "text-ink-subtle"
                          : "text-ink-muted"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-metric mt-0.5 text-[11px] text-ink-subtle">
                  {format(parseISO(item.start_datetime), "h:mm a")}
                </p>
                {item.linked_goal_ids.length > 0 && (
                  <p className="mt-1 truncate text-[11px] text-ink-muted">
                    Goals: {item.linked_goal_ids
                      .map((goalId) => goals.find((goal) => goal.id === goalId)?.title ?? goalId)
                      .join(", ")}
                  </p>
                )}
                {item.status === "pending" && (
                  <div className="mt-2 flex gap-1.5">
                    {item.requires_numeric_log ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => onItemSelect(item)}
                      >
                        {item.unit ? `Log ${item.unit}` : "Log"}
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          className="h-6 gap-1 px-2 text-[11px]"
                          onClick={() => handleComplete(item)}
                          disabled={submitting === item.id}
                        >
                          <CheckCircle className="h-3 w-3" />
                          {submitting === item.id ? "..." : "Done"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 gap-1 px-2 text-[11px]"
                          onClick={() => handleSkip(item)}
                          disabled={submitting === item.id}
                        >
                          <SkipForward className="h-3 w-3" />
                          Skip
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {goals.length > 0 && (
          <div>
            <p className="text-eyebrow mb-2">Active goals</p>
            <ul className="divide-y divide-hairline border-y border-hairline">
              {goals.map((goal) => {
                const progress = calculateGoalProgress(goal, logs);
                return (
                  <li key={goal.id} className="flex items-center justify-between gap-2 py-2">
                    <p className="truncate text-[12.5px] text-ink">{goal.title}</p>
                    <span
                      className={`text-metric shrink-0 text-[11px] ${
                        progress.is_on_track ? "text-ember" : "text-destructive"
                      }`}
                    >
                      {progress.percentage}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}

// --- Item Drawer (existing behavior) ---

interface ItemDrawerProps {
  item: CalendarItem;
  onClose: () => void;
  onRefresh: () => void;
  isMobile?: boolean;
}

function ItemDrawer({ item, onClose, onRefresh, isMobile }: ItemDrawerProps) {
  const [habit, setHabit] = useState<Habit | undefined>(undefined);
  const [goalTitles, setGoalTitles] = useState<string[]>([]);
  const [stackCueFromTitles, setStackCueFromTitles] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const selectedDate = format(parseISO(item.start_datetime), "yyyy-MM-dd");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!item.source_habit_id) {
        setHabit(undefined);
        return;
      }
      try {
        const ctx = await getServiceContext();
        const h = await habitsService.get(ctx, item.source_habit_id);
        if (!cancelled) setHabit(h);
      } catch (error) {
        if (!cancelled) {
          setHabit(undefined);
          console.error(error);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [item.source_habit_id]);

  useEffect(() => {
    let cancelled = false;

    async function loadGoalTitles() {
      if (item.linked_goal_ids.length === 0) {
        setGoalTitles([]);
        return;
      }

      try {
        const ctx = await getServiceContext();
        const goals = await goalsService.list(ctx);
        if (cancelled) return;

        const titleById = new Map(goals.map((goal) => [goal.id, goal.title]));
        setGoalTitles(
          item.linked_goal_ids.map((goalId) => titleById.get(goalId) ?? goalId),
        );
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setGoalTitles(item.linked_goal_ids);
        }
      }
    }

    loadGoalTitles();

    return () => {
      cancelled = true;
    };
  }, [item.linked_goal_ids]);

  useEffect(() => {
    let cancelled = false;

    async function loadStackCue() {
      if (!item.source_habit_id) {
        setStackCueFromTitles([]);
        return;
      }

      try {
        const ctx = await getServiceContext();
        const [stacks, allHabits, dayLogs] = await Promise.all([
          habitStacksService.list(ctx),
          habitsService.list(ctx),
          logsService.forDateRange(ctx, selectedDate, selectedDate),
        ]);
        if (cancelled) return;

        const cueMap = buildHabitStackCueMap({
          habits: allHabits,
          stacks,
          logs: dayLogs,
          today: selectedDate,
        });
        const habitById = new Map(allHabits.map((row) => [row.id, row.title]));
        const titles = (cueMap.get(item.source_habit_id) ?? [])
          .map((habitId) => habitById.get(habitId))
          .filter((title): title is string => Boolean(title));
        setStackCueFromTitles(titles);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setStackCueFromTitles([]);
        }
      }
    }

    loadStackCue();

    return () => {
      cancelled = true;
    };
  }, [item.source_habit_id, selectedDate]);

  async function handleComplete() {
    setSubmitting(true);
    try {
      const ctx = await getServiceContext();
      if (item.kind === "todo") {
        await todosService.update(ctx, item.id, { status: "complete" });
      } else if (item.source_habit_id) {
        await logsService.create(ctx, {
          entry_date: selectedDate,
          entry_datetime: new Date().toISOString(),
          source_type: "habit",
          source_id: item.source_habit_id,
          numeric_value: 1,
          unit: habit?.unit ?? item.unit,
          note: undefined,
        });
      }
      onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    setSubmitting(true);
    try {
      const ctx = await getServiceContext();
      if (item.kind === "todo") {
        await todosService.update(ctx, item.id, { status: "skipped" });
      } else if (item.source_habit_id) {
        await logsService.create(ctx, {
          entry_date: selectedDate,
          entry_datetime: new Date().toISOString(),
          source_type: "habit",
          source_id: item.source_habit_id,
          numeric_value: 0,
          unit: habit?.unit ?? item.unit,
          note: SKIPPED_LOG_NOTE,
        });
      }
      onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLog(value: number, note?: string, goalIds?: string[]) {
    setSubmitting(true);
    try {
      const ctx = await getServiceContext();
      await logsService.create(ctx, {
        entry_date: selectedDate,
        entry_datetime: new Date().toISOString(),
        source_type: item.kind === "habit_occurrence" ? "habit" : "todo",
        source_id: item.source_habit_id ?? item.id,
        numeric_value: value,
        unit: habit?.unit ?? item.unit,
        note,
        goal_ids: goalIds,
      });
      if (item.kind === "todo") {
        await todosService.update(ctx, item.id, { status: "complete" });
      }
      onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  const sheetClass = isMobile
    ? "surface-card-elevated flex max-h-[80dvh] flex-col rounded-t-2xl border-t border-hairline shadow-[var(--shadow-lifted)] pb-safe"
    : "surface-card-elevated flex h-full w-[360px] flex-col border-l border-hairline shadow-[var(--shadow-lifted)]";

  return (
    <aside className={sheetClass}>
      {isMobile && (
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-hairline-strong" aria-hidden />
        </div>
      )}
      <div className="flex items-start justify-between gap-2 border-b border-hairline px-4 py-3">
        <div className="min-w-0">
          <p className="text-eyebrow">
            {item.kind === "habit_occurrence" ? "Habit" : "Todo"}
          </p>
          <p className="mt-0.5 truncate text-[15px] font-medium text-ink">
            {item.title}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-1 text-ink-subtle transition-chrome hover:bg-muted hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 scroll-seamless">
        <div className="flex items-center gap-2">
          <span className="text-metric text-[11px] text-ink-muted">
            {format(parseISO(item.start_datetime), "h:mm a")} —{" "}
            {format(parseISO(item.end_datetime), "h:mm a")}
          </span>
          {item.never_miss_twice_alert && (
            <Badge variant="outline" className="border-ember bg-ember-soft text-ember">
              Never miss twice
            </Badge>
          )}
        </div>

        {goalTitles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {goalTitles.map((title) => (
              <Badge key={title} variant="outline" className="text-[10px]">
                {title}
              </Badge>
            ))}
          </div>
        )}

        {stackCueFromTitles.length > 0 && (
          <div className="rounded-md border border-ember bg-ember-soft px-2.5 py-1.5 text-[11.5px] text-ember">
            Stack up next after: {stackCueFromTitles[0]}
            {stackCueFromTitles.length > 1 ? ` (+${stackCueFromTitles.length - 1})` : ""}
          </div>
        )}

        {habit && (
          <div className="rounded-md border border-hairline bg-muted/40 p-3 text-[11.5px] text-ink-muted">
            {(habit.cue_time || habit.cue_location) && (
              <p className="truncate">
                <span className="text-ink-subtle">Time &amp; place: </span>
                {habit.cue_time ? `${habit.cue_time.slice(0, 5)}` : "Any time"}
                {habit.cue_location ? ` · ${habit.cue_location}` : ""}
              </p>
            )}
            <p className="mt-1.5">
              <span className="text-ink-subtle">Duration: </span>
              {habit.recurrence_config.duration_minutes ?? 30} min
            </p>
            {habit.cue_context && (
              <p className="mt-1 line-clamp-2">
                <span className="text-ink-subtle">Context: </span>
                {habit.cue_context}
              </p>
            )}
          </div>
        )}

        {item.requires_numeric_log && (
          <div>
            <p className="text-eyebrow mb-2">
              Log value{habit?.unit ?? item.unit ? ` (${habit?.unit ?? item.unit})` : ""}
            </p>
            <LogForm
              trackingType={habit?.tracking_type ?? "measurement"}
              unit={habit?.unit ?? item.unit}
              onSubmit={handleLog}
            />
          </div>
        )}

        {!item.requires_numeric_log && item.status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={handleComplete}
              disabled={submitting}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              {submitting ? "Saving..." : "Complete"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 gap-1.5"
              onClick={handleSkip}
              disabled={submitting}
            >
              <SkipForward className="h-3.5 w-3.5" /> Skip
            </Button>
          </div>
        )}

        {item.status === "complete" && (
          <p className="text-[13px] text-ember">Completed</p>
        )}
        {item.status === "skipped" && (
          <p className="text-[13px] text-ink-subtle">Skipped</p>
        )}
      </div>
    </aside>
  );
}
