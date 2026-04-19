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
  onClick: () => void;
}

export function HabitCard({ habit, onClick }: HabitCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-neutral-900">{habit.title}</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {recurrenceLabel[habit.recurrence_type]} - {habit.tracking_type}
            {habit.unit ? ` (${habit.unit})` : ""}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs capitalize">
          {habit.tracking_type}
        </Badge>
      </div>
    </button>
  );
}
