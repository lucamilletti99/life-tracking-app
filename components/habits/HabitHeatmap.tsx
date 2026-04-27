import type { HabitHeatmapCell } from "@/lib/habit-insights";

interface HabitHeatmapProps {
  cells: HabitHeatmapCell[];
}

const cellColor: Record<HabitHeatmapCell["status"], string> = {
  complete: "bg-ember",
  failed: "bg-destructive/80",
  skipped: "bg-ink-subtle/50",
  none: "bg-hairline",
};

function chunkByWeek(cells: HabitHeatmapCell[]): HabitHeatmapCell[][] {
  const weeks: HabitHeatmapCell[][] = [];

  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

function tooltipText(cell: HabitHeatmapCell): string {
  const valueLabel =
    cell.value != null
      ? `${cell.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${cell.unit ? ` ${cell.unit}` : ""}`
      : null;

  return valueLabel
    ? `${cell.date} · ${cell.status} · ${valueLabel}`
    : `${cell.date} · ${cell.status}`;
}

export function HabitHeatmap({ cells }: HabitHeatmapProps) {
  const weeks = chunkByWeek(cells);

  return (
    <div className="mt-3 surface-operator p-3">
      <p className="text-eyebrow mb-2">Last 12 weeks of activity</p>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-rows-7 gap-1">
            {week.map((cell) => (
              <div
                key={cell.date}
                className={`h-2.5 w-2.5 rounded-[3px] ${cellColor[cell.status]}`}
                title={tooltipText(cell)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
