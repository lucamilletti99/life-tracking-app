"use client";

import { format, isSameDay, parseISO } from "date-fns";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";

import { getDayLoad } from "@/lib/utils";
import type { CalendarItem } from "@/lib/types";

import { CalendarItemChip } from "./CalendarItem";
import { TimeColumn } from "./TimeColumn";

const HOUR_HEIGHT = 56;

const LOAD_DOT: Record<string, string> = {
  empty: "",
  light: "bg-sky-400",
  moderate: "bg-amber-400",
  busy: "bg-rose-400",
};

function timeToOffset(datetime: string): number {
  const d = parseISO(datetime);
  return (d.getHours() + d.getMinutes() / 60) * HOUR_HEIGHT;
}

function durationToHeight(start: string, end: string): number {
  const s = parseISO(start);
  const e = parseISO(end);
  const minutes = (e.getTime() - s.getTime()) / 60000;
  return Math.max((minutes / 60) * HOUR_HEIGHT, 20);
}

function slotId(date: Date, hour: number): string {
  return `slot-${format(date, "yyyy-MM-dd")}-${hour}`;
}

interface DroppableSlotProps {
  date: Date;
  hour: number;
  onClick: () => void;
}

function DroppableSlot({ date, hour, onClick }: DroppableSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: slotId(date, hour) });
  return (
    <div
      ref={setNodeRef}
      className={`absolute w-full cursor-pointer ${isOver ? "bg-blue-50/80" : "hover:bg-neutral-50/60"}`}
      style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
      onClick={onClick}
    />
  );
}

interface WeekViewProps {
  days: Date[];
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  onQuickComplete: (item: CalendarItem) => void;
  onSlotClick: (date: Date, hour: number) => void;
  onDayClick: (date: Date) => void;
  onReschedule: (itemId: string, newStart: string, newEnd: string) => void;
}

export function WeekView({
  days,
  items,
  onItemClick,
  onQuickComplete,
  onSlotClick,
  onDayClick,
  onReschedule,
}: WeekViewProps) {
  const today = new Date();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const draggedItem = items.find((i) => i.id === active.id);
    if (!draggedItem || draggedItem.kind !== "todo") return;

    const overId = String(over.id);
    const match = overId.match(/^slot-(\d{4}-\d{2}-\d{2})-(\d+)$/);
    if (!match) return;

    const [, dateStr, hourStr] = match;
    const newHour = parseInt(hourStr, 10);

    const originalStart = parseISO(draggedItem.start_datetime);
    const originalEnd = parseISO(draggedItem.end_datetime);
    const durationMs = originalEnd.getTime() - originalStart.getTime();

    const newStart = new Date(`${dateStr}T${String(newHour).padStart(2, "0")}:00:00`);
    const newEnd = new Date(newStart.getTime() + durationMs);

    onReschedule(draggedItem.id, newStart.toISOString(), newEnd.toISOString());
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-1 overflow-hidden">
        <TimeColumn />
        <div className="flex flex-1 overflow-x-auto">
          <div
            className="grid flex-1 overflow-y-auto"
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(120px, 1fr))` }}
          >
            {days.map((day) => {
              const load = getDayLoad(items, day);
              const dotClass = LOAD_DOT[load];

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => onDayClick(day)}
                  className="sticky top-0 z-10 flex h-10 w-full flex-col items-center justify-center border-b border-r border-neutral-200 bg-white hover:bg-neutral-50"
                >
                  <span className="text-[10px] uppercase tracking-wide text-neutral-400">
                    {format(day, "EEE")}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      isSameDay(day, today)
                        ? "flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white"
                        : "text-neutral-700"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {dotClass && (
                    <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${dotClass}`} />
                  )}
                </button>
              );
            })}

            {days.map((day) => {
              const dayItems = items.filter((item) => {
                const itemDate = parseISO(item.start_datetime);
                return isSameDay(itemDate, day) && !item.all_day;
              });

              return (
                <div
                  key={`col-${day.toISOString()}`}
                  className="relative border-r border-neutral-100"
                  style={{ height: `${24 * HOUR_HEIGHT}px` }}
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-neutral-100"
                      style={{ top: h * HOUR_HEIGHT }}
                    />
                  ))}

                  {Array.from({ length: 24 }, (_, h) => (
                    <DroppableSlot
                      key={h}
                      date={day}
                      hour={h}
                      onClick={() => onSlotClick(day, h)}
                    />
                  ))}

                  {dayItems.map((item) => (
                    <CalendarItemChip
                      key={item.id}
                      item={item}
                      onClick={onItemClick}
                      onQuickComplete={onQuickComplete}
                      draggable={item.kind === "todo"}
                      style={{
                        top: timeToOffset(item.start_datetime),
                        height: durationToHeight(item.start_datetime, item.end_datetime),
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <DragOverlay />
    </DndContext>
  );
}
