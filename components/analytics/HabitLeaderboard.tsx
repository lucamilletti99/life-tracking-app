import type { HabitStat } from "@/lib/analytics";

interface HabitLeaderboardProps {
  leaderboard: HabitStat[];
}

export function HabitLeaderboard({ leaderboard }: HabitLeaderboardProps) {
  const top = leaderboard.slice(0, 5);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">Streak leaderboard</h3>
      {top.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-400">No streak data yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {top.map((row, index) => (
            <div
              key={row.habitId}
              className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2"
            >
              <p className="truncate text-sm text-neutral-800">
                {index + 1}. {row.title}
              </p>
              <p className="text-sm font-semibold text-neutral-900">🔥 {row.currentStreak}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
