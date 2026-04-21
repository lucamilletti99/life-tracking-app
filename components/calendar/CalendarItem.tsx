import type { CSSProperties } from "react";
import { CheckCircle2 } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarItem as CalendarItemType } from "@/lib/types";

interface CalendarItemProps {
  item: CalendarItemType;
  onClick: (item: CalendarItemType) => void;
  onQuickComplete?: (item: CalendarItemType) => void;
  style?: CSSProperties;
  draggable?: boolean;
}

export function CalendarItemChip({
  item,
  onClick,
  onQuickComplete,
  style,
  draggable = false,
}: CalendarItemProps) {
  const isHabit = item.kind === "habit_occurrence";
  const isDone = item.status === "complete";
  const isSkipped = item.status === "skipped";
  const showQuickComplete = Boolean(
    onQuickComplete && item.status === "pending" && !item.requires_numeric_log,
  );

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled: !draggable,
    data: { item },
  });

  const dragStyle: CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {};

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...dragStyle, opacity: isDragging ? 0.4 : 1 }}
      className={cn(
        "absolute left-0.5 right-0.5 flex items-start gap-1 overflow-hidden rounded-md px-1 py-1 text-left text-xs font-medium transition-colors",
        isHabit
          ? "border border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100"
          : "border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
        item.never_miss_twice_alert && "border-amber-400 bg-amber-50 text-amber-900",
        isDone && "line-through opacity-50",
        isSkipped && "border-dashed opacity-60",
      )}
    >
      <button
        type="button"
        onClick={() => onClick(item)}
        className={cn(
          "min-w-0 flex-1 truncate text-left",
          draggable && !isHabit && "cursor-grab active:cursor-grabbing",
        )}
        {...(draggable ? { ...attributes, ...listeners } : {})}
      >
        <span className="truncate">{item.title}</span>
      </button>

      {showQuickComplete && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-4 w-4 shrink-0 p-0 text-current"
          onClick={(event) => {
            event.stopPropagation();
            onQuickComplete?.(item);
          }}
          aria-label="Quick complete"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
