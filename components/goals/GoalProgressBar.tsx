import { cn } from "@/lib/utils";

interface GoalProgressBarProps {
  percentage: number;
  isOnTrack: boolean;
  goalType: "target" | "accumulation" | "limit";
}

export function GoalProgressBar({
  percentage,
  isOnTrack,
  goalType,
}: GoalProgressBarProps) {
  const color =
    goalType === "limit"
      ? percentage > 80
        ? "bg-red-500"
        : percentage > 60
          ? "bg-amber-400"
          : "bg-emerald-500"
      : isOnTrack
        ? "bg-emerald-500"
        : "bg-amber-400";

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
