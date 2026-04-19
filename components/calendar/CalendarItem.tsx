import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";
import type { CalendarItem as CalendarItemType } from "@/lib/types";

interface CalendarItemProps {
  item: CalendarItemType;
  onClick: (item: CalendarItemType) => void;
  style?: CSSProperties;
}

export function CalendarItemChip({ item, onClick, style }: CalendarItemProps) {
  const isHabit = item.kind === "habit_occurrence";
  const isDone = item.status === "complete";

  return (
    <button
      onClick={() => onClick(item)}
      style={style}
      className={cn(
        "absolute left-0.5 right-0.5 overflow-hidden rounded-md px-2 py-1 text-left text-xs font-medium transition-opacity",
        isHabit
          ? "border border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100"
          : "border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
        isDone && "line-through opacity-50",
      )}
    >
      <span className="truncate">{item.title}</span>
    </button>
  );
}
