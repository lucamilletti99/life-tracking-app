import { HabitHeatmap } from "@/components/habits/HabitHeatmap";

interface CompletionHeatmapPanelProps {
  heatmaps: Array<{
    habitId: string;
    title: string;
    cells: Array<{ date: string; status: "complete" | "skipped" | "none" }>;
  }>;
}

export function CompletionHeatmapPanel({ heatmaps }: CompletionHeatmapPanelProps) {
  if (heatmaps.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-neutral-900">Completion heatmaps</h3>
        <p className="mt-3 text-sm text-neutral-400">No habit data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">Completion heatmaps</h3>
      <div className="mt-3 space-y-4">
        {heatmaps.slice(0, 3).map((heatmap) => (
          <div key={heatmap.habitId}>
            <p className="text-xs font-medium text-neutral-700">{heatmap.title}</p>
            <HabitHeatmap cells={heatmap.cells} />
          </div>
        ))}
      </div>
    </div>
  );
}
