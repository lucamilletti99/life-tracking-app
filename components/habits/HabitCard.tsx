import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Habit } from "@/lib/types";

const recurrenceLabel: Record<string, string> = {
  daily: "Every day",
  weekdays: "Selected days",
  times_per_week: "X/week",
  times_per_month: "X/month",
  day_of_month: "Day of month",
};

interface HabitCardProps {
  habit: Habit;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
}

export function HabitCard({ habit, onClick, onEdit }: HabitCardProps) {
  const content = (
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="font-medium text-neutral-900">{habit.title}</p>
        <p className="mt-0.5 text-xs text-neutral-400">
          {recurrenceLabel[habit.recurrence_type]} - {habit.tracking_type}
          {habit.unit ? ` (${habit.unit})` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(e);
            }}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <Pencil size={14} />
          </button>
        )}
        <Badge variant="secondary" className="text-xs capitalize">{habit.tracking_type}</Badge>
      </div>
    </div>
  );

  if (!onClick) {
    return (
      <div className="w-full rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-all hover:border-neutral-300 hover:shadow-md"
    >
      {content}
    </button>
  );
}
