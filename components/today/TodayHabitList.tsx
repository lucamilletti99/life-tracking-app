import { Check, CheckCircle2, Flame, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
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
  const allItems = Object.values(groups).flat();
  const hasAny = allItems.length > 0;
  const dueItems = allItems.filter((item) => item.status === "due" || item.status === "failed");
  const allDone = hasAny && dueItems.length === 0;
  const completedTracked = allItems.filter((item) => item.status === "done").length;
  const failedTracked = allItems.filter((item) => item.status === "failed").length;
  const notTracked = allItems.filter((item) => item.status === "due").length;

  return (
    <section>
      <div className="mb-6 flex items-baseline justify-between">
        <h3 className="text-display-sm text-[24px] text-ink">Habits</h3>
      </div>

      {hasAny && (
        <p className="mb-5 text-[11.5px] text-ink-subtle">
          Completed {completedTracked} · Failed {failedTracked} · Not tracked {notTracked}
        </p>
      )}

      {!hasAny && (
        <p className="text-[13px] text-ink-subtle">Nothing scheduled for today.</p>
      )}

      {allDone && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-hairline bg-surface px-4 py-3.5">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-ember" strokeWidth={1.75} />
          <div>
            <p className="text-[13.5px] font-medium text-ink">All done for today</p>
            <p className="text-[12px] text-ink-subtle">Nice work — your streak is safe.</p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(groups).map(([key, rows]) => {
          if (rows.length === 0) return null;

          return (
            <div key={key}>
              <p className="mb-3 text-eyebrow">{sectionTitle[key]}</p>
              <ul className="divide-y divide-hairline">
                {rows.map((row) => {
                  const busy = busyHabitId === row.habit.id;
                  const done = row.status === "done";
                  const failed = row.status === "failed";
                  const paused = row.status === "paused";
                  const hasStackCue = Boolean(row.stackCueFromTitles?.length);
                  const unitLabel = row.habit.unit?.trim();

                  return (
                    <li
                      key={row.habit.id}
                      className={cn(
                        "group/habit flex items-center gap-4 py-3.5 transition-chrome",
                        done && "opacity-55",
                      )}
                    >
                      {/* Status indicator dot */}
                      <div
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-chrome",
                          done
                            ? "border-transparent bg-ember text-white"
                            : failed
                              ? "border-destructive/50 bg-destructive/10 text-destructive"
                            : paused
                              ? "border-hairline bg-transparent text-ink-subtle"
                              : "border-hairline-strong bg-transparent",
                        )}
                      >
                        {done && <Check className="h-3 w-3" strokeWidth={3} />}
                      </div>

                      {/* Title + meta */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "truncate text-[14px] text-ink",
                              done && "line-through decoration-ink-subtle",
                            )}
                          >
                            {row.habit.title}
                          </p>
                          {hasStackCue && (
                            <span className="text-eyebrow text-ember">After {row.stackCueFromTitles![0]}</span>
                          )}
                        </div>
                        {row.linkedGoalTitles.length > 0 && (
                          <p className="mt-0.5 truncate text-[11px] text-ink-subtle">
                            {row.linkedGoalTitles[0]}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-3 text-[11.5px] text-ink-subtle">
                          {row.currentStreak > 0 && (
                            <span className="flex items-center gap-1 text-ember">
                              <Flame className="h-3 w-3" strokeWidth={2} />
                              <span className="text-metric">{row.currentStreak}</span>
                            </span>
                          )}
                          <span className="capitalize">{row.status}</span>
                          {row.habit.tracking_type !== "boolean" && unitLabel && (
                            <span>{unitLabel}</span>
                          )}
                          {paused && <span>paused</span>}
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        type="button"
                        onClick={() =>
                          row.habit.tracking_type === "boolean"
                            ? onQuickComplete(row.habit.id)
                            : onQuickLog(row.habit.id)
                        }
                        disabled={busy || paused || done}
                        className={cn(
                          "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-chrome",
                          "disabled:cursor-not-allowed disabled:opacity-40",
                          done
                            ? "border-hairline text-ink-subtle"
                            : "border-hairline bg-surface text-ink-muted hover:border-hairline-strong hover:text-ink",
                        )}
                      >
                        {row.habit.tracking_type === "boolean" ? (
                          <>
                            <Check className="h-3 w-3" strokeWidth={2} />
                            {busy ? "Saving" : done ? "Done" : "Complete"}
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" strokeWidth={2} />
                            {unitLabel ? `Log ${unitLabel}` : "Log"}
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
