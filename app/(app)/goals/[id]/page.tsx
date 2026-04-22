"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { GoalProgressBar } from "@/components/goals/GoalProgressBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calculateGoalProgress } from "@/lib/goal-calculations";
import { getServiceContext } from "@/lib/services/context";
import { goalsService } from "@/lib/services/goals";
import { habitsService } from "@/lib/services/habits";
import { logsService } from "@/lib/services/logs";
import type { Goal, Habit, LogEntry } from "@/lib/types";

export default function GoalDetailPage() {
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

        const [habitIds, todoIds, allLogs, rangedLogs] = await Promise.all([
          goalsService.getLinkedHabitIds(ctx, id),
          goalsService.getLinkedTodoIds(ctx, id),
          logsService.list(ctx),
          logsService.forDateRange(ctx, fetchedGoal.start_date, fetchedGoal.end_date),
        ]);

        const habitRows = (
          await Promise.all(habitIds.map((hid) => habitsService.get(ctx, hid)))
        ).filter((h): h is Habit => Boolean(h));

        if (!cancelled) {
          setGoal(fetchedGoal);
          setLinkedHabits(habitRows);
          setLinkedSourceIds([...habitIds, ...todoIds]);
          setLogs(
            [...rangedLogs].sort((a, b) =>
              b.entry_datetime.localeCompare(a.entry_datetime),
            ),
          );

          // keep full logs in memory for progress computation
          setLogs((prev) => {
            const merged = [...allLogs].sort((a, b) =>
              b.entry_datetime.localeCompare(a.entry_datetime),
            );
            return merged.length >= prev.length ? merged : prev;
          });
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

  if (loading) {
    return <div className="p-6 text-neutral-400">Loading goal...</div>;
  }

  if (!goal) {
    return <div className="p-6 text-neutral-400">Goal not found.</div>;
  }

  const progress = calculateGoalProgress(goal, logs, linkedSourceIds);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/goals")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-base font-semibold text-neutral-900">{goal.title}</h1>
        <Badge variant={progress.is_on_track ? "default" : "secondary"}>
          {progress.is_on_track ? "On track" : "Off track"}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <p className="text-3xl font-bold text-neutral-900">
                  {progress.current_value.toLocaleString()} {" "}
                  <span className="text-base font-normal text-neutral-400">{goal.unit}</span>
                </p>
                <p className="mt-1 text-sm text-neutral-400">
                  Target: {goal.target_value.toLocaleString()} {goal.unit}
                </p>
              </div>
              <span className="text-2xl font-bold text-neutral-300">{progress.percentage}%</span>
            </div>

            <GoalProgressBar
              percentage={progress.percentage}
              isOnTrack={progress.is_on_track}
              goalType={goal.goal_type}
            />
            <p className="mt-3 text-xs text-neutral-400">
              {format(parseISO(goal.start_date), "MMM d")} - {format(parseISO(goal.end_date), "MMM d, yyyy")} - {" "}
              {goal.goal_type}
            </p>
          </div>

          {linkedHabits.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-neutral-700">Linked habits</h2>
              <div className="flex flex-wrap gap-2">
                {linkedHabits.map((h) => (
                  <Badge key={h.id} variant="secondary">
                    {h.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {recentLogs.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-neutral-700">Recent logs</h2>
              <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-neutral-600">
                      {format(parseISO(log.entry_date), "MMM d, yyyy")}
                    </span>
                    <span className="text-sm font-medium text-neutral-900">
                      {log.numeric_value?.toLocaleString()} {log.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
