import { calculateGoalProgress } from "./goal-calculations";
import { getHabitTodayState, type HabitTodayState } from "./habit-insights";
import { computeStreak } from "./streak";
import type { Goal, Habit, HabitGoalLink, LogEntry, Todo } from "./types";

export interface TodayHabitItem {
  habit: Habit;
  status: HabitTodayState;
  currentStreak: number;
  linkedGoalIds: string[];
}

export interface TodaySnapshot {
  habitGroups: {
    morning: TodayHabitItem[];
    afternoon: TodayHabitItem[];
    evening: TodayHabitItem[];
    anytime: TodayHabitItem[];
  };
  todosToday: Todo[];
  goalProgress: ReturnType<typeof calculateGoalProgress>[];
  summary: {
    totalHabits: number;
    completedHabits: number;
    habitsWithActiveStreak: number;
  };
}

function bucketFromCueTime(cueTime?: string): keyof TodaySnapshot["habitGroups"] {
  if (!cueTime) return "anytime";

  const [hourText] = cueTime.split(":");
  const hour = Number(hourText);

  if (!Number.isFinite(hour)) return "anytime";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";

  return "anytime";
}

export function buildTodaySnapshot(input: {
  habits: Habit[];
  todos: Todo[];
  goals: Goal[];
  logs: LogEntry[];
  habitGoalLinks: HabitGoalLink[];
  today: string;
}): TodaySnapshot {
  const linksByHabit = new Map<string, string[]>();

  for (const link of input.habitGoalLinks) {
    const current = linksByHabit.get(link.habit_id) ?? [];
    linksByHabit.set(link.habit_id, [...current, link.goal_id]);
  }

  const habitGroups: TodaySnapshot["habitGroups"] = {
    morning: [],
    afternoon: [],
    evening: [],
    anytime: [],
  };

  const activeHabits = input.habits.filter((habit) => habit.is_active);

  for (const habit of activeHabits) {
    const status = getHabitTodayState(habit, input.logs, input.today);
    const streak = computeStreak(
      habit.id,
      habit.recurrence_type,
      habit.recurrence_config,
      input.logs,
      input.today,
    );

    const row: TodayHabitItem = {
      habit,
      status,
      currentStreak: streak.current,
      linkedGoalIds: linksByHabit.get(habit.id) ?? [],
    };

    habitGroups[bucketFromCueTime(habit.cue_time)].push(row);
  }

  const todosToday = input.todos
    .filter((todo) => todo.start_datetime.startsWith(input.today))
    .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));

  const goalProgress = input.goals.map((goal) => calculateGoalProgress(goal, input.logs));

  const summary = {
    totalHabits: activeHabits.length,
    completedHabits: [
      ...habitGroups.morning,
      ...habitGroups.afternoon,
      ...habitGroups.evening,
      ...habitGroups.anytime,
    ].filter((item) => item.status === "done").length,
    habitsWithActiveStreak: [
      ...habitGroups.morning,
      ...habitGroups.afternoon,
      ...habitGroups.evening,
      ...habitGroups.anytime,
    ].filter((item) => item.currentStreak > 0).length,
  };

  return {
    habitGroups,
    todosToday,
    goalProgress,
    summary,
  };
}
