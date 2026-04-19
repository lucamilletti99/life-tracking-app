"use client";

import { useCallback, useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate((n) => n + 1), []);

  function handleSlotClick(date: Date, hour: number) {
    setNewTodoSlot({ date, hour });
  }

  function handleCreateTodo(data: Omit<Todo, "id" | "created_at" | "updated_at">) {
    todosService.create(data);
    setNewTodoSlot(null);
    refresh();
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
        <Button size="sm" onClick={() => setNewTodoSlot({ date: calendar.currentDate, hour: 9 })}>
          + New
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <WeekView
          days={calendar.days}
          items={calendar.items}
          onItemClick={(item) => setSelectedItem(item)}
          onSlotClick={handleSlotClick}
        />
        <RightDrawer item={selectedItem} onClose={() => setSelectedItem(null)} onRefresh={refresh} />
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
