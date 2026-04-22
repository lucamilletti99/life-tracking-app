"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { GoalProgressBar } from "@/components/goals/GoalProgressBar";
import { TopBar } from "@/components/layout/TopBar";
import { buildAnalyticsSnapshot } from "@/lib/analytics";
import { getServiceContext } from "@/lib/services/context";
import { goalsService } from "@/lib/services/goals";
import { habitsService } from "@/lib/services/habits";
import { logsService } from "@/lib/services/logs";
import { todosService } from "@/lib/services/todos";
import type { Goal, Habit, HabitGoalLink, LogEntry, Todo, TodoGoalLink } from "@/lib/types";

export default function AnalyticsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [habitGoalLinks, setHabitGoalLinks] = useState<HabitGoalLink[]>([]);
  const [todoGoalLinks, setTodoGoalLinks] = useState<TodoGoalLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const ctx = await getServiceContext();
        const [goalRows, habitRows, todoRows, logRows, habitLinks, todoLinks] = await Promise.all([
          goalsService.list(ctx),
          habitsService.list(ctx),
          todosService.list(ctx),
          logsService.list(ctx),
          habitsService.listGoalLinks(ctx),
          todosService.listGoalLinks(ctx),
        ]);

        if (!cancelled) {
          setGoals(goalRows);
          setHabits(habitRows);
          setTodos(todoRows);
          setLogs(logRows);
          setHabitGoalLinks(habitLinks);
          setTodoGoalLinks(todoLinks);
        }
      } catch (error) {
        if (!cancelled) {
          setGoals([]);
          setHabits([]);
          setTodos([]);
          setLogs([]);
          setHabitGoalLinks([]);
          setTodoGoalLinks([]);
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
  }, []);

  const snapshot = useMemo(
    () => buildAnalyticsSnapshot({ goals, habits, todos, logs, habitGoalLinks, todoGoalLinks, days: 14 }),
    [goals, habits, todos, logs, habitGoalLinks, todoGoalLinks],
  );

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <TopBar title="Analytics" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Active goals</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">
                {snapshot.totals.totalGoals}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-400">On track</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">
                {snapshot.totals.onTrackGoals}/{snapshot.totals.totalGoals}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Todo completion</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">
                {snapshot.totals.todoCompletionRate}%
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Logs (14d)</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">
                {snapshot.totals.logsInWindow}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">Daily logged values</h2>
              <p className="text-xs text-neutral-400">Last 14 days</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snapshot.dailyLogSeries}>
                  <defs>
                    <linearGradient id="seriesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#171717" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#171717" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value: string) => format(parseISO(value), "MMM d")}
                    tick={{ fill: "#737373", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    labelFormatter={(label) =>
                      typeof label === "string"
                        ? format(parseISO(label), "MMM d, yyyy")
                        : String(label ?? "")
                    }
                    formatter={(value, name) => [
                      typeof value === "number" ? value.toLocaleString() : String(value ?? ""),
                      name === "total" ? "Total" : "Entries",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#171717"
                    fill="url(#seriesFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Goal progress snapshot</h2>
            {snapshot.goalProgress.length === 0 ? (
              <p className="text-sm text-neutral-400">Create goals to see analytics.</p>
            ) : (
              <div className="space-y-4">
                {snapshot.goalProgress.map((progress) => (
                  <div key={progress.goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="truncate text-sm font-medium text-neutral-800">
                        {progress.goal.title}
                      </p>
                      <p className="text-xs text-neutral-500">{progress.percentage}%</p>
                    </div>
                    <GoalProgressBar
                      percentage={progress.percentage}
                      isOnTrack={progress.is_on_track}
                      goalType={progress.goal.goal_type}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
