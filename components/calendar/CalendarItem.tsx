import type { CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";
import type { CalendarItem as CalendarItemType } from "@/lib/types";

interface CalendarItemProps {
  item: CalendarItemType;
  onClick: (item: CalendarItemType) => void;
  style?: CSSProperties;
  draggable?: boolean;
}

export function CalendarItemChip({ item, onClick, style, draggable = false }: CalendarItemProps) {
  const isHabit = item.kind === "habit_occurrence";
  const isDone = item.status === "complete";
  const isSkipped = item.status === "skipped";

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled: !draggable,
    data: { item },
  });

  const dragStyle: CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {};

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onClick(item)}
      style={{ ...style, ...dragStyle, opacity: isDragging ? 0.4 : 1 }}
      className={cn(
        "absolute left-0.5 right-0.5 overflow-hidden rounded-md px-2 py-1 text-left text-xs font-medium transition-colors",
        isHabit
          ? "border border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100"
          : "border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
        isDone && "line-through opacity-50",
        isSkipped && "border-dashed opacity-60",
        draggable && !isHabit && "cursor-grab active:cursor-grabbing",
      )}
      {...(draggable ? { ...attributes, ...listeners } : {})}
    >
      <span className="truncate">{item.title}</span>
    </button>
  );
}
