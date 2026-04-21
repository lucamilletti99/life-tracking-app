interface WeeklyComparisonCardProps {
  thisWeekCompleted: number;
  lastWeekCompleted: number;
  deltaPercent: number;
}

export function WeeklyComparisonCard({
  thisWeekCompleted,
  lastWeekCompleted,
  deltaPercent,
}: WeeklyComparisonCardProps) {
  const trendColor = deltaPercent >= 0 ? "text-emerald-600" : "text-rose-600";
  const trendPrefix = deltaPercent >= 0 ? "+" : "";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">Weekly comparison</h3>
      <p className="mt-2 text-sm text-neutral-700">
        This week: {thisWeekCompleted} completions
      </p>
      <p className="text-sm text-neutral-500">Last week: {lastWeekCompleted}</p>
      <p className={`mt-2 text-sm font-semibold ${trendColor}`}>
        {trendPrefix}{deltaPercent}% vs last week
      </p>
    </div>
  );
}
