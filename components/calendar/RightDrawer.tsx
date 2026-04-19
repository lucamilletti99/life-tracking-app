"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { CheckCircle, SkipForward, X } from "lucide-react";

import { LogForm } from "@/components/logs/LogForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { habitsService } from "@/lib/services/habits";
import { logsService } from "@/lib/services/logs";
import { todosService } from "@/lib/services/todos";
import type { CalendarItem, Habit } from "@/lib/types";

interface RightDrawerProps {
  item: CalendarItem | null;
  onClose: () => void;
  onRefresh: () => void;
}

export function RightDrawer({ item, onClose, onRefresh }: RightDrawerProps) {
  const [habit, setHabit] = useState<Habit | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!item?.source_habit_id) {
        setHabit(undefined);
        return;
      }

      try {
        const h = await habitsService.get(item.source_habit_id);
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
  }, [item?.source_habit_id]);

  if (!item) return null;
  const selected = item;

  async function handleComplete() {
    if (selected.kind === "todo") {
      await todosService.update(selected.id, { status: "complete" });
      onRefresh();
    }
    onClose();
  }

  async function handleSkip() {
    if (selected.kind === "todo") {
      await todosService.update(selected.id, { status: "skipped" });
      onRefresh();
    }
    onClose();
  }

  async function handleLog(value: number, note?: string) {
    await logsService.create({
      entry_date: format(parseISO(selected.start_datetime), "yyyy-MM-dd"),
      entry_datetime: new Date().toISOString(),
      source_type: selected.kind === "habit_occurrence" ? "habit" : "todo",
      source_id: selected.source_habit_id ?? selected.id,
      numeric_value: value,
      unit: habit?.unit,
      note,
    });

    if (selected.kind === "todo") {
      await todosService.update(selected.id, { status: "complete" });
    }

    onRefresh();
    onClose();
  }

  return (
    <aside className="flex h-full w-80 flex-col border-l border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <span className="text-sm font-semibold text-neutral-900">{selected.title}</span>
        <button onClick={onClose} className="rounded p-1 hover:bg-neutral-100">
          <X className="h-4 w-4 text-neutral-500" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-center gap-2">
          <Badge variant={selected.kind === "habit_occurrence" ? "secondary" : "outline"}>
            {selected.kind === "habit_occurrence" ? "Habit" : "Todo"}
          </Badge>
          <span className="text-xs text-neutral-400">
            {format(parseISO(selected.start_datetime), "h:mm a")} -{" "}
            {format(parseISO(selected.end_datetime), "h:mm a")}
          </span>
        </div>

        {selected.requires_numeric_log && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              Log value
            </p>
            <LogForm item={selected} unit={habit?.unit} onSubmit={handleLog} />
          </div>
        )}

        {!selected.requires_numeric_log && selected.status !== "complete" && (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 gap-1.5" onClick={handleComplete}>
              <CheckCircle className="h-3.5 w-3.5" /> Complete
            </Button>
            <Button size="sm" variant="ghost" className="flex-1 gap-1.5" onClick={handleSkip}>
              <SkipForward className="h-3.5 w-3.5" /> Skip
            </Button>
          </div>
        )}

        {selected.status === "complete" && (
          <p className="text-sm text-emerald-600">Completed</p>
        )}
      </div>
    </aside>
  );
}
