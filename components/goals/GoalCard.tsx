import { format, parseISO } from "date-fns";

import type { GoalProgress } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

import { GoalProgressBar } from "./GoalProgressBar";

interface GoalCardProps {
  progress: GoalProgress;
  onClick: () => void;
}

const typeLabel: Record<string, string> = {
  target: "Target",
  accumulation: "Accumulate",
  limit: "Limit",
};

export function GoalCard({ progress, onClick }: GoalCardProps) {
  const { goal, current_value, percentage, is_on_track } = progress;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-neutral-900">{goal.title}</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {format(parseISO(goal.start_date), "MMM d")} -{" "}
            {format(parseISO(goal.end_date), "MMM d, yyyy")}
          </p>
        </div>
        <Badge variant={is_on_track ? "default" : "secondary"} className="shrink-0 text-xs">
          {is_on_track ? "On track" : "Off track"}
        </Badge>
      </div>

      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="text-neutral-600">
          {current_value.toLocaleString()} {goal.unit}
        </span>
        <span className="text-xs text-neutral-400">
          {typeLabel[goal.goal_type]} - {goal.target_value.toLocaleString()} {goal.unit}
        </span>
      </div>

      <GoalProgressBar
        percentage={percentage}
        isOnTrack={is_on_track}
        goalType={goal.goal_type}
      />
    </button>
  );
}
