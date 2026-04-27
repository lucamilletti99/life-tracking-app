"use client";

import { useCallback, useEffect, useState } from "react";

import { getServiceContext } from "@/lib/services/context";
import { goalsService } from "@/lib/services/goals";
import { habitsService } from "@/lib/services/habits";
import { logsService } from "@/lib/services/logs";
import { todosService } from "@/lib/services/todos";
import { weeklyReviewsService } from "@/lib/services/weekly-reviews";
import type {
  Goal,
  Habit,
  HabitGoalLink,
  LogEntry,
  Todo,
  TodoGoalLink,
  WeeklyReview,
} from "@/lib/types";

export interface AnalyticsDataset {
  goals: Goal[];
  habits: Habit[];
  todos: Todo[];
  logs: LogEntry[];
  habitGoalLinks: HabitGoalLink[];
  todoGoalLinks: TodoGoalLink[];
  weeklyReviews: WeeklyReview[];
}

const EMPTY_DATASET: AnalyticsDataset = {
  goals: [],
  habits: [],
  todos: [],
  logs: [],
  habitGoalLinks: [],
  todoGoalLinks: [],
  weeklyReviews: [],
};

export function useAnalyticsDataset() {
  const [dataset, setDataset] = useState<AnalyticsDataset>(EMPTY_DATASET);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const ctx = await getServiceContext();
      const [goals, habits, todos, logs, habitGoalLinks, todoGoalLinks, weeklyReviews] =
        await Promise.all([
          goalsService.list(ctx),
          habitsService.list(ctx),
          todosService.list(ctx),
          logsService.list(ctx),
          habitsService.listGoalLinks(ctx),
          todosService.listGoalLinks(ctx),
          weeklyReviewsService.list(ctx),
        ]);

      setDataset({
        goals,
        habits,
        todos,
        logs,
        habitGoalLinks,
        todoGoalLinks,
        weeklyReviews,
      });
    } catch (err) {
      setDataset(EMPTY_DATASET);
      setError(err instanceof Error ? err : new Error("Failed to load analytics data"));
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const ctx = await getServiceContext();
        const [goals, habits, todos, logs, habitGoalLinks, todoGoalLinks, weeklyReviews] =
          await Promise.all([
            goalsService.list(ctx),
            habitsService.list(ctx),
            todosService.list(ctx),
            logsService.list(ctx),
            habitsService.listGoalLinks(ctx),
            todosService.listGoalLinks(ctx),
            weeklyReviewsService.list(ctx),
          ]);

        if (!cancelled) {
          setDataset({
            goals,
            habits,
            todos,
            logs,
            habitGoalLinks,
            todoGoalLinks,
            weeklyReviews,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setDataset(EMPTY_DATASET);
          setError(err instanceof Error ? err : new Error("Failed to load analytics data"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ...dataset,
    loading,
    refreshing,
    error,
    refresh,
  };
}
