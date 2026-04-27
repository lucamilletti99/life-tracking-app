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
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <div className="grid grid-cols-7 border-b border-hairline bg-background px-2 py-2">
        {weekdayLabels.map((day) => (
          <div key={day} className="text-eyebrow px-2 !text-[10px]">
            {day}
          </div>
        ))}
      </div>

      <div
        className="grid flex-1 gap-px overflow-y-auto bg-hairline"
        style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))` }}
      >
        {weeks.map((week) => (
          <div key={week[0].date} className="grid grid-cols-7 gap-px bg-hairline">
            {week.map((cell) => (
                <div
                  key={cell.date}
                  className={cn(
                    "min-h-32 surface-operator border border-transparent p-2 text-left align-top transition-chrome",
                    "hover:border-hairline-strong hover:bg-surface",
                    !cell.isCurrentMonth && "bg-muted/40",
                  )}
                >
                <div className="mb-2 flex items-center justify-between">
                  {onDateClick ? (
                    <button
                      type="button"
                      className={cn(
                        "text-metric inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium transition-chrome",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        cell.isToday
                          ? "bg-ember text-white"
                          : cell.isCurrentMonth
                            ? "text-ink hover:bg-muted"
                            : "text-ink-subtle hover:bg-muted",
                      )}
                      onClick={() => onDateClick(dayCellDate(cell))}
                      aria-label={`Open ${cell.date}`}
                    >
                      {format(dayCellDate(cell), "d")}
                    </button>
                  ) : (
                    <span
                      className={cn(
                        "text-metric inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium",
                        cell.isToday
                          ? "bg-ember text-white"
                          : cell.isCurrentMonth
                            ? "text-ink"
                            : "text-ink-subtle",
                      )}
                    >
                      {format(dayCellDate(cell), "d")}
                    </span>
                  )}
                  {cell.items.length > 0 && (
                    <span className="text-[10px] text-ink-subtle">{cell.items.length}</span>
                  )}
                </div>

                <div className="space-y-0.5">
                  {cell.items.slice(0, 3).map((item) => {
                    const isHabit = item.kind === "habit_occurrence";
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={cn(
                          "relative block w-full truncate rounded-sm py-0.5 pl-2.5 pr-1 text-left text-[11px] text-ink transition-chrome hover:bg-muted",
                        )}
                        onClick={(event) => {
                          event.stopPropagation();
                          onItemClick(item);
                        }}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "absolute left-0 top-1 bottom-1 w-[2px] rounded-r-full",
                            isHabit ? "bg-ember/70" : "bg-ink-subtle",
                          )}
                        />
                        {item.title}
                      </button>
                    );
                  })}

                  {cell.items.length > 3 && (
                    <p className="text-[10.5px] text-ink-subtle">+{cell.items.length - 3} more</p>
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
