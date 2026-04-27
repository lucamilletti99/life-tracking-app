"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { DayView } from "@/components/calendar/DayView";
import { MonthView } from "@/components/calendar/MonthView";
import { RightDrawer } from "@/components/calendar/RightDrawer";
import { WeekView } from "@/components/calendar/WeekView";
import { TodoForm } from "@/components/todos/TodoForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCalendarWeek } from "@/hooks/useCalendarWeek";
import { useSwipe } from "@/hooks/useSwipe";
import { getServiceContext } from "@/lib/services/context";
import { logsService } from "@/lib/services/logs";
import { todosService } from "@/lib/services/todos";
import type { CalendarItem, DrawerState, Todo } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const [view, setView] = useState<"week" | "day" | "month">("week");
  const calendar = useCalendarWeek(view);
  const [drawerState, setDrawerState] = useState<DrawerState>(null);
  const [newTodoSlot, setNewTodoSlot] = useState<{ date: Date; hour: number } | null>(null);

  // Swipe left = forward, swipe right = back
  const swipeHandlers = useSwipe({
    onSwipeLeft: calendar.goToNextPeriod,
    onSwipeRight: calendar.goToPrevPeriod,
    threshold: 60,
  });

  function handleSlotClick(date: Date, hour: number) {
    setNewTodoSlot({ date, hour });
  }

  function handleItemClick(item: CalendarItem) {
    setDrawerState({ mode: "item", item });
  }

  function handleDayClick(date: Date) {
    setDrawerState({ mode: "day", date });
  }

  async function handleReschedule(itemId: string, newStart: string, newEnd: string) {
    try {
      const ctx = await getServiceContext();
      await todosService.update(ctx, itemId, {
        start_datetime: newStart,
        end_datetime: newEnd,
      });
      calendar.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to reschedule");
    }
  }

  async function handleQuickComplete(item: CalendarItem) {
    try {
      const ctx = await getServiceContext();

      if (item.kind === "todo") {
        await todosService.update(ctx, item.id, { status: "complete" });
      } else if (item.source_habit_id) {
        const entryDate = format(parseISO(item.start_datetime), "yyyy-MM-dd");
        await logsService.create(ctx, {
          entry_date: entryDate,
          entry_datetime: new Date().toISOString(),
          source_type: "habit",
          source_id: item.source_habit_id,
          numeric_value: 1,
          unit: item.unit,
          note: undefined,
        });
      }

      calendar.refresh();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleCreateTodo(data: Omit<Todo, "id" | "created_at" | "updated_at">) {
    try {
      const ctx = await getServiceContext();
      await todosService.create(ctx, data);
      setNewTodoSlot(null);
      calendar.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create todo");
    }
  }

  const dateLabel =
    view === "week"
      ? `${format(calendar.weekStart, "MMM d")} – ${format(calendar.weekEnd, "MMM d, yyyy")}`
      : view === "day"
        ? format(calendar.currentDate, "EEEE, MMM d, yyyy")
        : format(calendar.currentDate, "MMMM yyyy");

  // Compact label for mobile
  const dateLabelShort =
    view === "week"
      ? `${format(calendar.weekStart, "MMM d")} – ${format(calendar.weekEnd, "MMM d")}`
      : view === "day"
        ? format(calendar.currentDate, "EEE, MMM d")
        : format(calendar.currentDate, "MMM yyyy");

  return (
    <div className="flex h-full flex-col bg-background">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="surface-shell flex h-14 shrink-0 items-center justify-between border-b border-hairline px-3 md:h-16 md:px-6">
        {/* Left: prev / next / today + date label */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={calendar.goToPrevPeriod}
            className="text-ink-muted hover:text-ink"
            aria-label="Previous period"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={calendar.goToNextPeriod}
            className="text-ink-muted hover:text-ink"
            aria-label="Next period"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* "Today" button — hidden on very small screens to save space */}
          <Button
            variant="ghost"
            size="sm"
            onClick={calendar.goToToday}
            className="hidden text-ink-muted hover:text-ink sm:inline-flex"
          >
            Today
          </Button>

          {/* Date label — compact on mobile, full on desktop */}
          <span className="ml-1 text-metric text-[12px] font-medium text-ink md:ml-3 md:text-[13px]">
            <span className="md:hidden">{dateLabelShort}</span>
            <span className="hidden md:inline">{dateLabel}</span>
          </span>
        </div>

        {/* Right: view switcher + new button */}
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="surface-operator flex items-center gap-0.5 rounded-full border border-hairline p-0.5 shadow-[var(--shadow-soft)] md:gap-1 md:p-1">
            {(["week", "day", "month"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-full px-2 py-1 text-[10.5px] font-medium capitalize transition-chrome md:px-3 md:py-1.5 md:text-[11.5px]",
                  view === v
                    ? "bg-ink text-background shadow-[var(--shadow-soft)]"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {/* Abbreviate on mobile */}
                <span className="md:hidden">
                  {v === "week" ? "Wk" : v === "day" ? "Day" : "Mo"}
                </span>
                <span className="hidden md:inline capitalize">{v}</span>
              </button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => setNewTodoSlot({ date: calendar.currentDate, hour: 9 })}
            className="h-7 gap-1 px-2 text-[11px] md:h-8 md:px-3 md:text-[12px]"
          >
            + New
          </Button>
        </div>
      </header>

      {/* ── Calendar body ───────────────────────────────────────────────── */}
      <div
        className="flex flex-1 overflow-hidden pb-tab-bar md:pb-0"
        {...swipeHandlers}
      >
        {calendar.loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-ink-subtle">
            Loading calendar...
          </div>
        ) : calendar.error ? (
          <div className="flex flex-1 items-center justify-center text-sm text-destructive">
            Failed to load calendar data. Please refresh.
          </div>
        ) : (
          <>
            {view === "week" && (
              <WeekView
                days={calendar.days}
                items={calendar.items}
                onItemClick={handleItemClick}
                onQuickComplete={(item) => void handleQuickComplete(item)}
                onSlotClick={handleSlotClick}
                onDayClick={handleDayClick}
                onReschedule={handleReschedule}
              />
            )}
            {view === "day" && (
              <DayView
                date={calendar.currentDate}
                items={calendar.items}
                onItemClick={handleItemClick}
                onQuickComplete={(item) => void handleQuickComplete(item)}
              />
            )}
            {view === "month" && (
              <MonthView
                currentDate={calendar.currentDate}
                items={calendar.items}
                onItemClick={handleItemClick}
                onDateClick={(date) => {
                  calendar.setCurrentDate(date);
                  setView("day");
                }}
              />
            )}
          </>
        )}

        {/* RightDrawer — full-height panel on desktop, bottom sheet on mobile */}
        <RightDrawer
          drawerState={drawerState}
          allItems={calendar.items}
          onClose={() => setDrawerState(null)}
          onRefresh={calendar.refresh}
          onItemSelect={(item) => setDrawerState({ mode: "item", item })}
        />
      </div>

      <Dialog open={!!newTodoSlot} onOpenChange={(open) => !open && setNewTodoSlot(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New todo</DialogTitle>
          </DialogHeader>
          {newTodoSlot && (
            <TodoForm
              initial={newTodoSlot}
              onSubmit={handleCreateTodo}
              onCancel={() => setNewTodoSlot(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
