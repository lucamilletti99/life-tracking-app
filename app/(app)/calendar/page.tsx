"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { DayView } from "@/components/calendar/DayView";
import { MonthView } from "@/components/calendar/MonthView";
import { RightDrawer } from "@/components/calendar/RightDrawer";
import { WeekView } from "@/components/calendar/WeekView";
import { TodoForm } from "@/components/todos/TodoForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCalendarWeek } from "@/hooks/useCalendarWeek";
import { todosService } from "@/lib/services/todos";
import type { CalendarItem, Todo } from "@/lib/types";

export default function CalendarPage() {
  const calendar = useCalendarWeek();
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [newTodoSlot, setNewTodoSlot] = useState<{ date: Date; hour: number } | null>(
    null,
  );
  const [view, setView] = useState<"week" | "day" | "month">("week");

  function handleSlotClick(date: Date, hour: number) {
    setNewTodoSlot({ date, hour });
  }

  async function handleCreateTodo(
    data: Omit<Todo, "id" | "created_at" | "updated_at">,
  ) {
    await todosService.create(data);
    setNewTodoSlot(null);
    calendar.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={calendar.goToPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={calendar.goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={calendar.goToToday}>
            Today
          </Button>
          <span className="ml-2 text-sm font-semibold text-neutral-700">
            {format(calendar.weekStart, "MMM d")} - {format(calendar.weekEnd, "MMM d, yyyy")}
          </span>
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
                onItemClick={setSelectedItem}
                onSlotClick={handleSlotClick}
              />
            )}
            {view === "day" && (
              <DayView
                date={calendar.currentDate}
                items={calendar.items}
                onItemClick={setSelectedItem}
              />
            )}
            {view === "month" && <MonthView />}
          </>
        )}

        <RightDrawer
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onRefresh={calendar.refresh}
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
