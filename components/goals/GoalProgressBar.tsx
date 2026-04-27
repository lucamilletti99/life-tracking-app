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
  // Subtle, monochrome-leaning fills. Ember signals healthy progress;
  // muted ink communicates neutral; destructive only for "limit" overreach.
  const tone =
    goalType === "limit"
      ? percentage > 80
        ? "bg-destructive"
        : percentage > 60
          ? "bg-ember"
          : "bg-ink"
      : isOnTrack
        ? "bg-ember"
        : "bg-ink-subtle";

  return (
    <div className="h-[6px] w-full overflow-hidden rounded-full bg-hairline">
      <div
        className={cn("h-full rounded-full transition-smooth", tone)}
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      />
    </div>
  );
}
