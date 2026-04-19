"use client";

import { format, isSameDay, parseISO } from "date-fns";

import type { CalendarItem } from "@/lib/types";

import { CalendarItemChip } from "./CalendarItem";
import { TimeColumn } from "./TimeColumn";

const HOUR_HEIGHT = 56;

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

interface WeekViewProps {
  days: Date[];
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  onSlotClick: (date: Date, hour: number) => void;
}

export function WeekView({ days, items, onItemClick, onSlotClick }: WeekViewProps) {
  const today = new Date();

  return (
    <div className="flex flex-1 overflow-hidden">
      <TimeColumn />
      <div className="flex flex-1 overflow-x-auto">
        <div
          className="grid flex-1 overflow-y-auto"
          style={{ gridTemplateColumns: `repeat(${days.length}, minmax(120px, 1fr))` }}
        >
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="sticky top-0 z-10 flex h-10 flex-col items-center justify-center border-b border-r border-neutral-200 bg-white"
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
            </div>
          ))}

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
                  <div
                    key={h}
                    className="absolute w-full cursor-pointer hover:bg-neutral-50/60"
                    style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    onClick={() => onSlotClick(day, h)}
                  />
                ))}

                {dayItems.map((item) => (
                  <CalendarItemChip
                    key={item.id}
                    item={item}
                    onClick={onItemClick}
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
  );
}
