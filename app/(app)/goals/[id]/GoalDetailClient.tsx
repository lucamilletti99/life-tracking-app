"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import dynamic from "next/dynamic";

import { GoalProgressBar } from "@/components/goals/GoalProgressBar";
import { Button } from "@/components/ui/button";

// Lazy-load so recharts doesn't block the goals detail page compile.
const GoalTrajectoryChart = dynamic(
  () =>
    import("@/components/goals/GoalTrajectoryChart").then(
      (m) => m.GoalTrajectoryChart,
    ),
  {
    ssr: false,
    loading: () => <div className="h-56 w-full animate-pulse rounded-xl bg-muted" />,
  },
);
import {
  buildGoalTrajectory,
  buildGoalTrajectoryMessage,
  calculateGoalProgress,
} from "@/lib/goal-calculations";
import { getServiceContext } from "@/lib/services/context";
import { goalsService } from "@/lib/services/goals";
import { habitsService } from "@/lib/services/habits";
import { logsService } from "@/lib/services/logs";
import type { Goal, Habit, LogEntry } from "@/lib/types";

export function GoalDetailClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [goal, setGoal] = useState<Goal | undefined>(undefined);
  const [linkedHabits, setLinkedHabits] = useState<Habit[]>([]);
  const [linkedSourceIds, setLinkedSourceIds] = useState<string[] | undefined>(undefined);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const ctx = await getServiceContext();
        const fetchedGoal = await goalsService.get(ctx, id);
        if (!fetchedGoal) {
          if (!cancelled) {
            setGoal(undefined);
            setLinkedHabits([]);
            setLogs([]);
          }
          return;
        }

        const [habitIds, todoIds, allLogs] = await Promise.all([
          goalsService.getLinkedHabitIds(ctx, id),
          goalsService.getLinkedTodoIds(ctx, id),
          logsService.list(ctx),
        ]);

        const habitRows = (
          await Promise.all(habitIds.map((hid) => habitsService.get(ctx, hid)))
        ).filter((h): h is Habit => Boolean(h));

        if (!cancelled) {
          setGoal(fetchedGoal);
          setLinkedHabits(habitRows);
          setLinkedSourceIds([...habitIds, ...todoIds]);
          setLogs(
            [...allLogs].sort((a, b) =>
              b.entry_datetime.localeCompare(a.entry_datetime),
            ),
          );
        }
      } catch (error) {
        if (!cancelled) {
          setGoal(undefined);
          setLinkedHabits([]);
          setLogs([]);
          console.error(error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const recentLogs = useMemo(() => {
    if (!goal) return [] as LogEntry[];
    return logs
      .filter((l) => l.entry_date >= goal.start_date && l.entry_date <= goal.end_date)
      .sort((a, b) => b.entry_datetime.localeCompare(a.entry_datetime))
      .slice(0, 10);
  }, [goal, logs]);

  const trajectory = useMemo(() => {
    if (!goal) return null;
    return buildGoalTrajectory(goal, logs, format(new Date(), "yyyy-MM-dd"));
  }, [goal, logs]);

  const trajectoryMessage = useMemo(() => {
    if (!goal || !trajectory) return null;
    return buildGoalTrajectoryMessage(goal, trajectory);
  }, [goal, trajectory]);

  if (loading) {
    return <div className="p-8 text-sm text-ink-subtle">Loading goal…</div>;
  }

  if (!goal) {
    return <div className="p-8 text-sm text-ink-subtle">Goal not found.</div>;
  }

  const progress = calculateGoalProgress(goal, logs, linkedSourceIds);
  const typeLabel =
    goal.goal_type === "target"
      ? "Target"
      : goal.goal_type === "accumulation"
        ? "Accumulate"
        : "Limit";

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <div className="flex h-14 items-center gap-3 border-b border-hairline bg-background px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/goals")}
          className="text-ink-muted hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex min-w-0 flex-1 items-baseline gap-3">
          <p className="text-eyebrow shrink-0">{typeLabel}</p>
          <h1 className="truncate text-[15px] font-medium text-ink">{goal.title}</h1>
        </div>
        <span
          className={`text-metric shrink-0 text-[11px] ${
            progress.is_completed ? "text-ember" : progress.is_on_track ? "text-ember" : "text-destructive"
          }`}
        >
          {progress.is_completed ? "Completed" : progress.is_on_track ? "On track" : "Off track"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scroll-seamless">
        <div className="mx-auto max-w-2xl space-y-8 px-8 py-8">
          <div>
            <div className="mb-5 flex items-baseline justify-between gap-4">
              <div>
                <p className="text-display-sm text-[40px] text-ink">
                  {progress.current_value.toLocaleString()}
                  <span className="ml-2 text-[16px] text-ink-subtle">{goal.unit}</span>
                </p>
                <p className="text-metric mt-1 text-[11px] text-ink-subtle">
                  Target · {goal.target_value.toLocaleString()} {goal.unit}
                </p>
              </div>
              <span className="text-metric text-[36px] font-light text-ink-subtle">
                {progress.percentage.toFixed(0)}%
              </span>
            </div>

            <GoalProgressBar
              percentage={progress.percentage}
              isOnTrack={progress.is_on_track}
              goalType={goal.goal_type}
            />
            <p className="text-metric mt-3 text-[11px] text-ink-subtle">
              {format(parseISO(goal.start_date), "MMM d")} —{" "}
              {format(parseISO(goal.end_date), "MMM d, yyyy")}
            </p>
          </div>

          {trajectory && (
            <div className="space-y-4">
              <GoalTrajectoryChart trajectory={trajectory} />
              <div className="rounded-xl border border-hairline bg-surface p-5">
                <p className="text-[13.5px] font-medium text-ink">
                  {trajectoryMessage?.title}
                </p>
                <p className="mt-1.5 text-[12.5px] text-ink-muted">
                  {trajectoryMessage?.detail}
                </p>
                <p className="text-metric mt-2.5 text-[11px] text-ink-subtle">
                  Projected end value ·{" "}
                  {trajectory.projectedEndValue.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}{" "}
                  {goal.unit}
                </p>
              </div>
            </div>
          )}

          {linkedHabits.length > 0 && (
            <div>
              <p className="text-eyebrow mb-3">Linked habits</p>
              <ul className="divide-y divide-hairline border-y border-hairline">
                {linkedHabits.map((h) => (
                  <li key={h.id} className="py-2.5 text-[13px] text-ink">
                    {h.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recentLogs.length > 0 && (
            <div>
              <p className="text-eyebrow mb-3">Recent logs</p>
              <ul className="divide-y divide-hairline border-y border-hairline">
                {recentLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <span className="text-[12.5px] text-ink-muted">
                      {format(parseISO(log.entry_date), "MMM d, yyyy")}
                    </span>
                    <span className="text-metric text-[12.5px] text-ink">
                      {log.numeric_value?.toLocaleString()}{" "}
                      <span className="text-ink-subtle">{log.unit}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
