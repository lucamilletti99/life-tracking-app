import type { HabitStat } from "@/lib/analytics";

interface HabitCompletionTableProps {
  stats: HabitStat[];
}

export function HabitCompletionTable({ stats }: HabitCompletionTableProps) {
  if (stats.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-neutral-900">Habit completion rates</h3>
        <p className="mt-3 text-sm text-neutral-400">No habits yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">Habit completion rates</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-neutral-500">
            <tr>
              <th className="pb-2 pr-3">Habit</th>
              <th className="pb-2 pr-3">Streak</th>
              <th className="pb-2 pr-3">7d</th>
              <th className="pb-2 pr-3">30d</th>
              <th className="pb-2">90d</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((row) => (
              <tr key={row.habitId} className="border-t border-neutral-100 text-neutral-700">
                <td className="py-2 pr-3 font-medium text-neutral-900">{row.title}</td>
                <td className="py-2 pr-3">{row.currentStreak}/{row.bestStreak}</td>
                <td className="py-2 pr-3">{row.completionRate7d}%</td>
                <td className="py-2 pr-3">{row.completionRate30d}%</td>
                <td className="py-2">{row.completionRate90d}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
