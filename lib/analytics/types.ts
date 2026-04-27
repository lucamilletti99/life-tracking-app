import type { Goal, GoalProgress, Habit, WeeklyReview } from "@/lib/types";
import type { GoalTrajectory } from "@/lib/goal-calculations";

export type AnalyticsGranularity = "daily" | "weekly" | "monthly";

export interface AnalyticsRange {
  startDate: string;
  endDate: string;
}

export type AnalyticsPresetKey = "1m" | "2m" | "3m" | "6m" | "1y" | "2y" | "custom";

export interface AnalyticsControlsState {
  startDate: string;
  endDate: string;
  granularity: AnalyticsGranularity;
  comparisonEnabled: boolean;
  presetKey: AnalyticsPresetKey;
}

export interface AnalyticsSummaryTrendPoint {
  bucketStart: string;
  bucketEnd: string;
  logEntries: number;
  numericTotal: number;
  habitCompletions: number;
  todoCompleted: number;
}

export interface AnalyticsComparisonModel {
  previousRange: AnalyticsRange;
  deltaBalancedScore: number;
  deltaHabitConsistencyScore: number;
  deltaGoalPaceScore: number;
  deltaExecutionVolumeScore: number;
  deltaTodoCompletionRate: number;
  deltaLogsInRange: number;
}

export interface AnalyticsSummaryKpis {
  totalGoals: number;
  totalHabits: number;
  totalTodos: number;
  onTrackGoals: number;
  todoCompletionRate: number;
  logsInRange: number;
  loggingConsistencyRate: number;
}

export interface WeeklyReviewInsight {
  isPromptRecommended: boolean;
  latestScore: number | null;
  recentScores: number[];
  totalReviews: number;
  latestWeekStart: string | null;
  reviews: WeeklyReview[];
}

export interface AnalyticsSummaryModel {
  range: AnalyticsRange;
  granularity: AnalyticsGranularity;
  balancedScore: number;
  habitConsistencyScore: number;
  goalPaceScore: number;
  executionVolumeScore: number;
  kpis: AnalyticsSummaryKpis;
  trendSeries: AnalyticsSummaryTrendPoint[];
  reviewInsight: WeeklyReviewInsight;
  comparison: AnalyticsComparisonModel | null;
  goalProgress: GoalProgress[];
}

export interface HabitCompletionTrendPoint {
  bucketStart: string;
  bucketEnd: string;
  completed: number;
  expected: number;
  rate: number;
}

export interface HabitNumericTrendPoint {
  bucketStart: string;
  bucketEnd: string;
  value: number | null;
}

export interface HabitNumericSeries {
  unit: string;
  points: HabitNumericTrendPoint[];
}

export interface HabitProgressModel {
  habit: Habit;
  completionRate: number;
  streakCurrent: number;
  streakBest: number;
  hasProgress: boolean;
  completionTrend: HabitCompletionTrendPoint[];
  numericSeries: HabitNumericSeries | null;
}

export interface GoalProgressModel {
  goal: Goal;
  completionPercent: number;
  paceLabel: GoalTrajectory["paceLabel"];
  trajectory: GoalTrajectory;
}

export interface AnalyticsProgressModel {
  range: AnalyticsRange;
  granularity: AnalyticsGranularity;
  habits: HabitProgressModel[];
  goals: GoalProgressModel[];
}
