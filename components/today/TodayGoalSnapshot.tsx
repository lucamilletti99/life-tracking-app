import { GoalProgressBar } from "@/components/goals/GoalProgressBar";
import type { GoalProgress } from "@/lib/types";

interface TodayGoalSnapshotProps {
  goalProgress: GoalProgress[];
}

export function TodayGoalSnapshot({ goalProgress }: TodayGoalSnapshotProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">Goal impact today</h3>
      {goalProgress.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-400">No goals yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {goalProgress.map((progress) => (
            <div key={progress.goal.id}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className="truncate text-sm text-neutral-800">{progress.goal.title}</p>
                <p className="text-xs text-neutral-500">{progress.percentage}%</p>
              </div>
              <GoalProgressBar
                percentage={progress.percentage}
                isOnTrack={progress.is_on_track}
                goalType={progress.goal.goal_type}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
