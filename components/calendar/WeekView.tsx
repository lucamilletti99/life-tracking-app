"use client";

import { useCallback, useRef, type UIEvent } from "react";
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

import { useIsMobile } from "@/hooks/useIsMobile";

import { getDayLoad } from "@/lib/utils";
import type { CalendarItem } from "@/lib/types";

import { CalendarItemChip } from "./CalendarItem";
import { TimeColumn } from "./TimeColumn";

const HOUR_HEIGHT = 56;

const LOAD_DOT: Record<string, string> = {
  empty: "",
  light: "bg-ink-subtle",
  moderate: "bg-ember",
  busy: "bg-destructive",
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
      className={`absolute w-full cursor-pointer transition-chrome ${isOver ? "bg-ember-soft" : "hover:bg-muted"}`}
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
  const isMobile = useIsMobile();
  const timeScrollRef = useRef<HTMLDivElement | null>(null);
  const gridScrollRef = useRef<HTMLDivElement | null>(null);
  const syncingScrollRef = useRef<"time" | "grid" | null>(null);

  // On mobile we disable pointer drag-and-drop to prevent conflict with
  // the horizontal swipe navigation on the calendar page.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: isMobile ? 9999 : 8 },
    }),
  );

  const releaseScrollLock = useCallback((source: "time" | "grid") => {
    requestAnimationFrame(() => {
      if (syncingScrollRef.current === source) {
        syncingScrollRef.current = null;
      }
    });
  }, []);

  const handleGridScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (syncingScrollRef.current === "time") {
        syncingScrollRef.current = null;
        return;
      }

      const target = timeScrollRef.current;
      if (!target) return;

      syncingScrollRef.current = "grid";
      target.scrollTop = event.currentTarget.scrollTop;
      releaseScrollLock("grid");
    },
    [releaseScrollLock],
  );

  const handleTimeScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (syncingScrollRef.current === "grid") {
        syncingScrollRef.current = null;
        return;
      }

      const target = gridScrollRef.current;
      if (!target) return;

      syncingScrollRef.current = "time";
      target.scrollTop = event.currentTarget.scrollTop;
      releaseScrollLock("time");
    },
    [releaseScrollLock],
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
        <div
          ref={timeScrollRef}
          onScroll={handleTimeScroll}
          className="w-14 overflow-y-auto overflow-x-hidden border-r border-hairline"
        >
          <TimeColumn />
        </div>
        <div className="flex flex-1 overflow-x-auto">
          <div
            ref={gridScrollRef}
            onScroll={handleGridScroll}
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
                  className="sticky top-0 z-10 flex h-12 w-full flex-col items-center justify-center border-b border-r border-hairline bg-background/92 transition-chrome supports-backdrop-filter:backdrop-blur-sm hover:bg-surface"
                >
                  <span className="text-eyebrow !text-[10px]">
                    {format(day, "EEE")}
                  </span>
                  <span
                    className={`text-[13px] font-medium ${
                      isSameDay(day, today)
                        ? "text-metric flex h-6 w-6 items-center justify-center rounded-full bg-ember text-white"
                        : "text-ink"
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
                  className="relative border-r border-hairline"
                  style={{ height: `${24 * HOUR_HEIGHT}px` }}
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-hairline"
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
                      // Disable drag-and-drop on mobile — swipe navigates instead
                      draggable={item.kind === "todo" && !isMobile}
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
