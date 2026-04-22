import { Flame } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TodayHabitItem } from "@/lib/today-snapshot";

const sectionTitle: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  anytime: "Anytime",
};

interface TodayHabitListProps {
  groups: {
    morning: TodayHabitItem[];
    afternoon: TodayHabitItem[];
    evening: TodayHabitItem[];
    anytime: TodayHabitItem[];
  };
  busyHabitId: string | null;
  onQuickComplete: (habitId: string) => void;
  onQuickLog: (habitId: string) => void;
}

export function TodayHabitList({
  groups,
  busyHabitId,
  onQuickComplete,
  onQuickLog,
}: TodayHabitListProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">Habits</h3>
      <div className="mt-4 space-y-4">
        {Object.entries(groups).map(([key, rows]) => {
          if (rows.length === 0) return null;

          return (
            <div key={key}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {sectionTitle[key]}
              </p>
              <div className="space-y-2">
                {rows.map((row) => (
                  <div
                    key={row.habit.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                      row.stackCueFromTitles?.length
                        ? "border-amber-300 bg-amber-50/30"
                        : "border-neutral-100"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">{row.habit.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={row.status === "done" ? "default" : "outline"} className="text-[11px]">
                          {row.status}
                        </Badge>
                        <Badge variant="secondary" className="text-[11px]">
                          <Flame className="mr-1 h-3 w-3" /> {row.currentStreak}
                        </Badge>
                        {row.stackCueFromTitles?.length ? (
                          <Badge variant="outline" className="border-amber-300 text-[11px] text-amber-700">
                            Stack up next
                          </Badge>
                        ) : null}
                      </div>
                      {row.stackCueFromTitles?.length ? (
                        <p className="mt-1 truncate text-xs text-amber-700">
                          After: {row.stackCueFromTitles[0]}
                          {row.stackCueFromTitles.length > 1
                            ? ` +${row.stackCueFromTitles.length - 1}`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {row.habit.tracking_type === "boolean" ? (
                        <Button
                          size="sm"
                          className="h-7"
                          onClick={() => onQuickComplete(row.habit.id)}
                          disabled={busyHabitId === row.habit.id || row.status === "done" || row.status === "paused"}
                        >
                          {busyHabitId === row.habit.id ? "Saving..." : "Complete"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7"
                          onClick={() => onQuickLog(row.habit.id)}
                          disabled={busyHabitId === row.habit.id || row.status === "paused"}
                        >
                          Log
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
