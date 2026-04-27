import { computeHabitCompletionRate, getHabitTodayState } from "./habit-insights";
import { isHabitEffectivelyPaused } from "./habit-pause";
import type { Goal, Habit, HabitGoalLink, LogEntry } from "./types";

export type GoalHabitExecutionTone = "none" | "strong" | "mixed" | "weak";

export interface GoalHabitExecutionSummary {
  goalId: string;
  linkedHabits: number;
  dueToday: number;
  completedToday: number;
  completionRate7d: number;
  tone: GoalHabitExecutionTone;
  summary: string;
}

export function buildGoalHabitExecutionMap(input: {
  goals: Goal[];
  habits: Habit[];
  habitGoalLinks: HabitGoalLink[];
  logs: LogEntry[];
  today: string;
}): Map<string, GoalHabitExecutionSummary> {
  const linkedHabitIdsByGoal = new Map<string, string[]>();
  for (const link of input.habitGoalLinks) {
    const current = linkedHabitIdsByGoal.get(link.goal_id) ?? [];
    linkedHabitIdsByGoal.set(link.goal_id, [...current, link.habit_id]);
  }

  const activeHabitsById = new Map(
    input.habits
      .filter((habit) => habit.is_active && !isHabitEffectivelyPaused(habit, input.today))
      .map((habit) => [habit.id, habit]),
  );

  const summaryMap = new Map<string, GoalHabitExecutionSummary>();

  for (const goal of input.goals) {
    const linkedIds = linkedHabitIdsByGoal.get(goal.id) ?? [];
    const linkedHabits = linkedIds
      .map((habitId) => activeHabitsById.get(habitId))
      .filter((habit): habit is Habit => Boolean(habit));

    if (linkedHabits.length === 0) {
      summaryMap.set(goal.id, {
        goalId: goal.id,
        linkedHabits: 0,
        dueToday: 0,
        completedToday: 0,
        completionRate7d: 0,
        tone: "none",
        summary: "No linked habits yet. Link a habit to drive this goal.",
      });
      continue;
    }

    let dueToday = 0;
    let completedToday = 0;
    let completionRateSum = 0;

    for (const habit of linkedHabits) {
      const status = getHabitTodayState(habit, input.logs, input.today);
      if (status === "due" || status === "done" || status === "failed") {
        dueToday += 1;
      }
      if (status === "done") {
        completedToday += 1;
      }
      completionRateSum += computeHabitCompletionRate(habit, input.logs, input.today, 7);
    }

    const completionRate7d = Math.round(completionRateSum / linkedHabits.length);
    const todayRate = dueToday > 0 ? Math.round((completedToday / dueToday) * 100) : null;

    let tone: GoalHabitExecutionTone;
    let summary: string;

    if (dueToday === 0) {
      tone = completionRate7d >= 70 ? "strong" : "mixed";
      summary =
        completionRate7d >= 70
          ? "No linked habits are due today. Weekly execution is strong."
          : "No linked habits are due today. Keep your weekly rhythm steady.";
    } else if ((todayRate ?? 0) >= 80 && completionRate7d >= 70) {
      tone = "strong";
      summary = "Execution is strong. Keep this cadence and protect consistency.";
    } else if ((todayRate ?? 0) >= 50 || completionRate7d >= 50) {
      tone = "mixed";
      summary = "Execution is mixed. One more completed habit today would improve momentum.";
    } else {
      tone = "weak";
      summary = "Execution is lagging. Start with the easiest linked habit now.";
    }

    summaryMap.set(goal.id, {
      goalId: goal.id,
      linkedHabits: linkedHabits.length,
      dueToday,
      completedToday,
      completionRate7d,
      tone,
      summary,
    });
  }

  return summaryMap;
}
