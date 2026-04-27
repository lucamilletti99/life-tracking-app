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

/**
 * Subtle, monochrome chip. The "kind" of item is communicated by a left
 * accent bar — ember for habits, muted ink for todos — rather than a saturated
 * background, which keeps the calendar grid calm.
 */
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
  const isAlert = Boolean(item.never_miss_twice_alert);
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
        "group/item absolute left-1 right-1 flex items-start gap-1 overflow-hidden rounded-md border pl-2 pr-1 py-1 text-left text-[11.5px] font-medium transition-chrome",
        "border-hairline bg-surface text-ink shadow-[var(--shadow-soft)] hover:border-hairline-strong",
        isAlert && "border-ember bg-ember-soft",
        isDone && "line-through opacity-55",
        isSkipped && "border-dashed opacity-55",
      )}
    >
      {/* Left accent rail */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1 bottom-1 w-[2px] rounded-r-full",
          isAlert ? "bg-ember" : isHabit ? "bg-ember/70" : "bg-ink-subtle",
        )}
      />

      <button
        type="button"
        onClick={() => onClick(item)}
        className={cn(
          // Minimum 44px touch target height on mobile (Apple HIG)
          "min-w-0 flex-1 truncate pl-1 text-left",
          "min-h-[44px] md:min-h-0",
          draggable && !isHabit && "cursor-grab active:cursor-grabbing",
        )}
        {...(draggable ? { ...attributes, ...listeners } : {})}
      >
        <span className="truncate">
          {item.title}
          {item.requires_numeric_log && item.unit ? ` · ${item.unit}` : ""}
        </span>
      </button>

      {showQuickComplete && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          // Larger touch target on mobile
          className="h-4 w-4 shrink-0 p-0 text-ink-muted hover:text-ink md:h-4 md:w-4 [&]:min-h-[44px] [&]:min-w-[44px] md:[&]:min-h-0 md:[&]:min-w-0"
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
