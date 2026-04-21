import type { HabitHeatmapCell } from "@/lib/habit-insights";

interface HabitHeatmapProps {
  cells: HabitHeatmapCell[];
}

const cellColor: Record<HabitHeatmapCell["status"], string> = {
  complete: "bg-emerald-500",
  skipped: "bg-neutral-300",
  none: "bg-neutral-100",
};

function chunkByWeek(cells: HabitHeatmapCell[]): HabitHeatmapCell[][] {
  const weeks: HabitHeatmapCell[][] = [];

  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

export function HabitHeatmap({ cells }: HabitHeatmapProps) {
  const weeks = chunkByWeek(cells);

  return (
    <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
      <p className="mb-2 text-[11px] text-neutral-500">Last 12 weeks</p>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-rows-7 gap-1">
            {week.map((cell) => (
              <div
                key={cell.date}
                className={`h-2.5 w-2.5 rounded-[2px] ${cellColor[cell.status]}`}
                title={`${cell.date} · ${cell.status}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
