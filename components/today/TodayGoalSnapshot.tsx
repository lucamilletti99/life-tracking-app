import { GoalProgressBar } from "@/components/goals/GoalProgressBar";
import type { GoalProgress } from "@/lib/types";

interface TodayGoalSnapshotProps {
  goalProgress: GoalProgress[];
}

export function TodayGoalSnapshot({ goalProgress }: TodayGoalSnapshotProps) {
  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between">
        <h3 className="text-display-sm text-[20px] text-ink">Goals</h3>
        <span className="text-eyebrow">Impact today</span>
      </div>

      {goalProgress.length === 0 ? (
        <p className="text-[13px] text-ink-subtle">No goals yet.</p>
      ) : (
        <ul className="divide-y divide-hairline">
          {goalProgress.map((progress) => (
            <li key={progress.goal.id} className="py-4">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <p className="truncate text-[14px] text-ink">{progress.goal.title}</p>
                <div className="flex items-center gap-2">
                  {progress.is_completed && (
                    <span className="text-[10.5px] font-medium uppercase tracking-wide text-ember">
                      Completed
                    </span>
                  )}
                  <p className="text-metric text-[12px] text-ink-muted">
                    {progress.percentage}
                    <span className="text-ink-subtle">%</span>
                  </p>
                </div>
              </div>
              <GoalProgressBar
                percentage={progress.percentage}
                isOnTrack={progress.is_on_track}
                goalType={progress.goal.goal_type}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
