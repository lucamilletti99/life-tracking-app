"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { DayView } from "@/components/calendar/DayView";
import { MonthView } from "@/components/calendar/MonthView";
import { RightDrawer } from "@/components/calendar/RightDrawer";
import { WeekView } from "@/components/calendar/WeekView";
import { TodoForm } from "@/components/todos/TodoForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCalendarWeek } from "@/hooks/useCalendarWeek";
import { getServiceContext } from "@/lib/services/context";
import { logsService } from "@/lib/services/logs";
import { todosService } from "@/lib/services/todos";
import type { CalendarItem, DrawerState, Todo } from "@/lib/types";

export default function CalendarPage() {
  const [view, setView] = useState<"week" | "day" | "month">("week");
  const calendar = useCalendarWeek(view);
  const [drawerState, setDrawerState] = useState<DrawerState>(null);
  const [newTodoSlot, setNewTodoSlot] = useState<{ date: Date; hour: number } | null>(null);

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
    const ctx = await getServiceContext();
    await todosService.update(ctx, itemId, {
      start_datetime: newStart,
      end_datetime: newEnd,
    });
    calendar.refresh();
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
          unit: undefined,
          note: undefined,
        });
      }

      calendar.refresh();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleCreateTodo(data: Omit<Todo, "id" | "created_at" | "updated_at">) {
    const ctx = await getServiceContext();
    await todosService.create(ctx, data);
    setNewTodoSlot(null);
    calendar.refresh();
  }

  const dateLabel =
    view === "week"
      ? `${format(calendar.weekStart, "MMM d")} - ${format(calendar.weekEnd, "MMM d, yyyy")}`
      : view === "day"
        ? format(calendar.currentDate, "EEEE, MMM d, yyyy")
        : format(calendar.currentDate, "MMMM yyyy");

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={calendar.goToPrevPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={calendar.goToNextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={calendar.goToToday}>
            Today
          </Button>
          <span className="ml-2 text-sm font-semibold text-neutral-700">{dateLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-neutral-200">
            {(["week", "day", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs capitalize transition-colors ${
                  view === v
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => setNewTodoSlot({ date: calendar.currentDate, hour: 9 })}
          >
            + New
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {calendar.loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
            Loading calendar...
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
