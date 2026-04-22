import { format } from "date-fns";

import { buildMonthGrid, dayCellDate } from "@/lib/month-view";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "@/lib/types";

interface MonthViewProps {
  currentDate: Date;
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  onDateClick?: (date: Date) => void;
}

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthView({ currentDate, items, onItemClick, onDateClick }: MonthViewProps) {
  const weeks = buildMonthGrid(currentDate, items);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="grid grid-cols-7 border-b border-neutral-200 bg-white px-2 py-2">
        {weekdayLabels.map((day) => (
          <div key={day} className="px-2 text-xs font-medium uppercase text-neutral-400">
            {day}
          </div>
        ))}
      </div>

      <div
        className="grid flex-1 gap-px overflow-y-auto bg-neutral-200"
        style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))` }}
      >
        {weeks.map((week) => (
          <div key={week[0].date} className="grid grid-cols-7 gap-px bg-neutral-200">
            {week.map((cell) => (
              <div
                key={cell.date}
                className={cn(
                  "min-h-32 bg-white p-2 text-left align-top",
                  "hover:bg-neutral-50 transition-colors",
                  !cell.isCurrentMonth && "bg-neutral-50",
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  {onDateClick ? (
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        cell.isToday
                          ? "bg-neutral-900 text-white"
                          : cell.isCurrentMonth
                            ? "text-neutral-800 hover:bg-neutral-100"
                            : "text-neutral-400 hover:bg-neutral-100",
                      )}
                      onClick={() => onDateClick(dayCellDate(cell))}
                      aria-label={`Open ${cell.date}`}
                    >
                      {format(dayCellDate(cell), "d")}
                    </button>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        cell.isToday
                          ? "bg-neutral-900 text-white"
                          : cell.isCurrentMonth
                            ? "text-neutral-800"
                            : "text-neutral-400",
                      )}
                    >
                      {format(dayCellDate(cell), "d")}
                    </span>
                  )}
                  {cell.items.length > 0 && (
                    <span className="text-[10px] text-neutral-400">{cell.items.length} items</span>
                  )}
                </div>

                <div className="space-y-1">
                  {cell.items.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={cn(
                        "block w-full truncate rounded px-1.5 py-1 text-left text-[11px] font-medium",
                        item.kind === "habit_occurrence"
                          ? "bg-violet-50 text-violet-700"
                          : "bg-blue-50 text-blue-700",
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        onItemClick(item);
                      }}
                    >
                      {item.title}
                    </button>
                  ))}

                  {cell.items.length > 3 && (
                    <p className="text-[11px] text-neutral-500">+{cell.items.length - 3} more</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
