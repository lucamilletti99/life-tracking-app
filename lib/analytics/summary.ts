import { differenceInCalendarDays } from "date-fns";

import { calculateGoalProgress } from "@/lib/goal-calculations";
import { getHabitLogStatusMap } from "@/lib/habit-status";
import { getOccurrencesInRange } from "@/lib/recurrence";
import { shouldShowWeeklyReviewPrompt } from "@/lib/weekly-review";
import type {
  Goal,
  Habit,
  HabitGoalLink,
  LogEntry,
  Todo,
  TodoGoalLink,
  WeeklyReview,
} from "@/lib/types";

import {
  buildBucketSequence,
  bucketStartIso,
  clampAnalyticsRange,
  rangeIncludes,
  toPreviousComparisonRange,
} from "./timeframe";
import type {
  AnalyticsComparisonModel,
  AnalyticsGranularity,
  AnalyticsRange,
  AnalyticsSummaryModel,
  AnalyticsSummaryTrendPoint,
} from "./types";

interface BuildAnalyticsSummaryInput {
  goals: Goal[];
  habits: Habit[];
  todos: Todo[];
  logs: LogEntry[];
  habitGoalLinks: HabitGoalLink[];
  todoGoalLinks: TodoGoalLink[];
  weeklyReviews: WeeklyReview[];
  range: AnalyticsRange;
  granularity: AnalyticsGranularity;
  comparisonEnabled: boolean;
}

interface WindowMetrics {
  habitConsistencyScore: number;
  goalPaceScore: number;
  executionVolumeScore: number;
  balancedScore: number;
  totalGoals: number;
  totalHabits: number;
  totalTodos: number;
  onTrackGoals: number;
  todoCompletionRate: number;
  logsInRange: number;
  loggingConsistencyRate: number;
  goalProgress: ReturnType<typeof calculateGoalProgress>[];
  trendSeries: AnalyticsSummaryTrendPoint[];
}

function buildGoalSourceMap(
  habitGoalLinks: HabitGoalLink[],
  todoGoalLinks: TodoGoalLink[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const link of habitGoalLinks) {
    const ids = map.get(link.goal_id) ?? [];
    ids.push(link.habit_id);
    map.set(link.goal_id, ids);
  }

  for (const link of todoGoalLinks) {
    const ids = map.get(link.goal_id) ?? [];
    ids.push(link.todo_id);
    map.set(link.goal_id, ids);
  }

  return map;
}

function scoreFromRatio(completed: number, expected: number): number {
  if (expected <= 0) return 0;
  return Math.round((completed / expected) * 100);
}

function averageScore(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(avg);
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeBalancedScore(input: {
  habitConsistencyScore: number;
  goalPaceScore: number;
  executionVolumeScore: number;
}): number {
  const score =
    input.habitConsistencyScore * 0.4 +
    input.goalPaceScore * 0.4 +
    input.executionVolumeScore * 0.2;

  return clampScore(score);
}

function toDateOnly(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}

function buildWindowMetrics(input: Omit<BuildAnalyticsSummaryInput, "weeklyReviews" | "comparisonEnabled">): WindowMetrics {
  const range = clampAnalyticsRange(input.range);
  const goalSourceMap = buildGoalSourceMap(input.habitGoalLinks, input.todoGoalLinks);

  const todosInRange = input.todos.filter((todo) => {
    const day = toDateOnly(todo.start_datetime);
    return rangeIncludes(day, range);
  });

  const logsInRange = input.logs.filter((log) => rangeIncludes(log.entry_date, range));
  const habitStatusMap = getHabitLogStatusMap(input.logs, input.habits);

  const habitCompletionScores = input.habits.map((habit) => {
    const expected = getOccurrencesInRange(habit, range.startDate, range.endDate);
    if (expected.length === 0) return 0;

    const completed = expected.filter((day) => {
      const key = `${habit.id}|${day}`;
      return habitStatusMap.get(key) === "complete";
    }).length;

    return scoreFromRatio(completed, expected.length);
  });

  const habitConsistencyScore = averageScore(habitCompletionScores);

  const goalProgress = input.goals.map((goal) =>
    calculateGoalProgress(goal, input.logs, goalSourceMap.get(goal.id), range.endDate),
  );
  const onTrackGoals = goalProgress.filter((goal) => goal.is_on_track).length;
  const goalPaceScore = input.goals.length === 0 ? 0 : scoreFromRatio(onTrackGoals, input.goals.length);

  const completedTodos = todosInRange.filter((todo) => todo.status === "complete").length;
  const todoCompletionRate = todosInRange.length === 0 ? 0 : scoreFromRatio(completedTodos, todosInRange.length);

  const rangeDays = differenceInCalendarDays(new Date(`${range.endDate}T00:00:00`), new Date(`${range.startDate}T00:00:00`)) + 1;
  const distinctLogDays = new Set(logsInRange.map((log) => log.entry_date)).size;
  const loggingConsistencyRate = rangeDays <= 0 ? 0 : scoreFromRatio(distinctLogDays, rangeDays);

  const executionVolumeScore = clampScore((todoCompletionRate + loggingConsistencyRate) / 2);
  const balancedScore = computeBalancedScore({
    habitConsistencyScore,
    goalPaceScore,
    executionVolumeScore,
  });

  const buckets = buildBucketSequence(range, input.granularity);

  const trendSeries = buckets.map(({ bucketStart, bucketEnd }) => {
    const bucketLogs = logsInRange.filter(
      (log) =>
        bucketStartIso(log.entry_date, input.granularity) === bucketStart &&
        log.entry_date >= range.startDate &&
        log.entry_date <= range.endDate,
    );

    const bucketTodosCompleted = todosInRange.filter((todo) => {
      const day = toDateOnly(todo.start_datetime);
      return (
        bucketStartIso(day, input.granularity) === bucketStart &&
        todo.status === "complete"
      );
    }).length;

    let habitCompletions = 0;
    for (const [key, status] of habitStatusMap.entries()) {
      if (status !== "complete") continue;
      const [, day] = key.split("|");
      if (!rangeIncludes(day, range)) continue;
      if (bucketStartIso(day, input.granularity) !== bucketStart) continue;
      habitCompletions += 1;
    }

    return {
      bucketStart,
      bucketEnd,
      logEntries: bucketLogs.length,
      numericTotal: bucketLogs.reduce((sum, log) => sum + (log.numeric_value ?? 0), 0),
      habitCompletions,
      todoCompleted: bucketTodosCompleted,
    };
  });

  return {
    habitConsistencyScore,
    goalPaceScore,
    executionVolumeScore,
    balancedScore,
    totalGoals: input.goals.length,
    totalHabits: input.habits.length,
    totalTodos: todosInRange.length,
    onTrackGoals,
    todoCompletionRate,
    logsInRange: logsInRange.length,
    loggingConsistencyRate,
    goalProgress,
    trendSeries,
  };
}

function buildComparison(
  current: WindowMetrics,
  previous: WindowMetrics,
  previousRange: AnalyticsRange,
): AnalyticsComparisonModel {
  return {
    previousRange,
    deltaBalancedScore: current.balancedScore - previous.balancedScore,
    deltaHabitConsistencyScore:
      current.habitConsistencyScore - previous.habitConsistencyScore,
    deltaGoalPaceScore: current.goalPaceScore - previous.goalPaceScore,
    deltaExecutionVolumeScore:
      current.executionVolumeScore - previous.executionVolumeScore,
    deltaTodoCompletionRate: current.todoCompletionRate - previous.todoCompletionRate,
    deltaLogsInRange: current.logsInRange - previous.logsInRange,
  };
}

function buildWeeklyReviewInsight(
  weeklyReviews: WeeklyReview[],
  asOfDate: string,
): AnalyticsSummaryModel["reviewInsight"] {
  const sorted = [...weeklyReviews].sort((a, b) => a.week_start.localeCompare(b.week_start));
  const scored = sorted
    .filter((review) => typeof review.overall_score === "number")
    .map((review) => review.overall_score as number);

  return {
    isPromptRecommended: shouldShowWeeklyReviewPrompt({
      asOf: asOfDate,
      weeklyReviews,
    }),
    latestScore: scored.length > 0 ? scored[scored.length - 1] : null,
    recentScores: scored.slice(-6),
    totalReviews: weeklyReviews.length,
    latestWeekStart: sorted.length > 0 ? sorted[sorted.length - 1].week_start : null,
    reviews: sorted,
  };
}

export function buildAnalyticsSummaryModel(input: BuildAnalyticsSummaryInput): AnalyticsSummaryModel {
  const range = clampAnalyticsRange(input.range);
  const current = buildWindowMetrics({
    goals: input.goals,
    habits: input.habits,
    todos: input.todos,
    logs: input.logs,
    habitGoalLinks: input.habitGoalLinks,
    todoGoalLinks: input.todoGoalLinks,
    range,
    granularity: input.granularity,
  });

  let comparison: AnalyticsSummaryModel["comparison"] = null;
  if (input.comparisonEnabled) {
    const previousRange = toPreviousComparisonRange(range);
    const previous = buildWindowMetrics({
      goals: input.goals,
      habits: input.habits,
      todos: input.todos,
      logs: input.logs,
      habitGoalLinks: input.habitGoalLinks,
      todoGoalLinks: input.todoGoalLinks,
      range: previousRange,
      granularity: input.granularity,
    });
    comparison = buildComparison(current, previous, previousRange);
  }

  return {
    range,
    granularity: input.granularity,
    balancedScore: current.balancedScore,
    habitConsistencyScore: current.habitConsistencyScore,
    goalPaceScore: current.goalPaceScore,
    executionVolumeScore: current.executionVolumeScore,
    kpis: {
      totalGoals: current.totalGoals,
      totalHabits: current.totalHabits,
      totalTodos: current.totalTodos,
      onTrackGoals: current.onTrackGoals,
      todoCompletionRate: current.todoCompletionRate,
      logsInRange: current.logsInRange,
      loggingConsistencyRate: current.loggingConsistencyRate,
    },
    trendSeries: current.trendSeries,
    reviewInsight: buildWeeklyReviewInsight(input.weeklyReviews, range.endDate),
    comparison,
    goalProgress: current.goalProgress,
  };
}
