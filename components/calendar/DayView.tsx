import { format } from "date-fns";
import { CheckCircle2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CalendarItem } from "@/lib/types";

interface DayViewProps {
  date: Date;
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  onQuickComplete: (item: CalendarItem) => void;
}

export function DayView({ date, items, onItemClick, onQuickComplete }: DayViewProps) {
  const dayItems = items.filter((i) =>
    i.start_datetime.startsWith(format(date, "yyyy-MM-dd")),
  );
  const habitLinkedTodos = dayItems.filter(
    (item) => item.kind === "todo" && Boolean(item.source_habit_id),
  );
  // Exclude habit-linked todos from the main list — they already appear in the tile section above.
  const mainListItems = dayItems.filter(
    (item) => !(item.kind === "todo" && Boolean(item.source_habit_id)),
  );

  return (
    <div
      role="region"
      aria-label="Day agenda"
      className="flex flex-1 flex-col gap-4 overflow-y-auto bg-background p-8"
    >
      <div>
        <p className="text-eyebrow">{format(date, "EEEE")}</p>
        <h2 className="text-display-sm mt-1 text-[28px] text-ink">
          {format(date, "MMMM d")}
        </h2>
      </div>
      {habitLinkedTodos.length > 0 && (
        <div className="rounded-xl border border-hairline bg-surface p-3">
          <p className="text-eyebrow mb-2">Habit-linked todos</p>
          <div className="flex flex-wrap gap-2">
            {habitLinkedTodos.map((item) => (
              <div
                key={`tile-${item.id}`}
                className="group/tile flex min-w-[180px] flex-1 items-center justify-between gap-2 rounded-lg border border-hairline bg-background px-3 py-2 text-left transition-chrome hover:border-hairline-strong hover:bg-surface"
              >
                <button
                  type="button"
                  onClick={() => onItemClick(item)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-[12.5px] text-ink">{item.title}</p>
                  <p className="text-[10.5px] capitalize text-ink-subtle">
                    {item.status}
                    {item.requires_numeric_log && item.unit ? ` · ${item.unit}` : ""}
                  </p>
                </button>
                {item.status === "pending" && (
                  <Button
                    type="button"
                    size="sm"
                    variant={item.requires_numeric_log ? "outline" : "ghost"}
                    className="h-6 gap-1 px-2 text-[10.5px]"
                    onClick={() => {
                      if (item.requires_numeric_log) {
                        onItemClick(item);
                        return;
                      }
                      onQuickComplete(item);
                    }}
                  >
                    {item.requires_numeric_log ? (
                      <>
                        <Plus className="h-3 w-3" />
                        Add
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Done
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {dayItems.length === 0 ? (
        <p className="text-sm text-ink-subtle">Nothing scheduled for this day.</p>
      ) : mainListItems.length === 0 ? null : (
        <ul className="divide-y divide-hairline border-y border-hairline">
          {mainListItems.map((item) => (
            <li
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onItemClick(item)}
              onKeyDown={(e) => e.key === "Enter" && onItemClick(item)}
              className="group/row flex items-start gap-4 py-3.5 text-left transition-chrome hover:bg-muted/50"
            >
              {/* Time */}
              <div className="w-20 shrink-0 pt-0.5">
                <p className="text-metric text-[12px] text-ink-muted">
                  {item.start_datetime.slice(11, 16)}
                </p>
                <p className="text-metric text-[11px] text-ink-subtle">
                  {item.end_datetime.slice(11, 16)}
                </p>
              </div>

              {/* Title + meta */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] text-ink">{item.title}</p>
                <p className="mt-0.5 text-[11.5px] capitalize text-ink-subtle">
                  {item.status}
                </p>
              </div>

              {/* Quick complete */}
              {item.status === "pending" && !item.requires_numeric_log && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0 text-ink-subtle hover:text-ember"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickComplete(item);
                  }}
                  aria-label="Quick complete"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
