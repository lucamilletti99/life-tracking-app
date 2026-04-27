import { calculateGoalProgress } from "./goal-calculations";
import { isHabitEffectivelyPaused } from "./habit-pause";
import { buildHabitStackCueMap } from "./habit-stack-insights";
import { getHabitTodayState, type HabitTodayState } from "./habit-insights";
import { computeStreak } from "./streak";
import type { Goal, Habit, HabitGoalLink, HabitStack, LogEntry, Todo, TodoGoalLink } from "./types";

export interface TodayHabitItem {
  habit: Habit;
  status: HabitTodayState;
  currentStreak: number;
  linkedGoalIds: string[];
  linkedGoalTitles: string[];
  stackCueFromTitles?: string[];
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
  todoGoalLinks: TodoGoalLink[];
  habitStacks: HabitStack[];
  today: string;
}): TodaySnapshot {
  const habitById = new Map(input.habits.map((habit) => [habit.id, habit]));
  const goalById = new Map(input.goals.map((goal) => [goal.id, goal]));
  const linksByHabit = new Map<string, string[]>();
  const linkedHabitsByGoal = new Map<string, string[]>();
  const linkedTodosByGoal = new Map<string, string[]>();
  const stackCueByHabitId = buildHabitStackCueMap({
    habits: input.habits,
    stacks: input.habitStacks,
    logs: input.logs,
    today: input.today,
  });

  for (const link of input.habitGoalLinks) {
    const current = linksByHabit.get(link.habit_id) ?? [];
    linksByHabit.set(link.habit_id, [...current, link.goal_id]);

    const goalHabits = linkedHabitsByGoal.get(link.goal_id) ?? [];
    linkedHabitsByGoal.set(link.goal_id, [...goalHabits, link.habit_id]);
  }

  for (const link of input.todoGoalLinks) {
    const goalTodos = linkedTodosByGoal.get(link.goal_id) ?? [];
    linkedTodosByGoal.set(link.goal_id, [...goalTodos, link.todo_id]);
  }

  const habitGroups: TodaySnapshot["habitGroups"] = {
    morning: [],
    afternoon: [],
    evening: [],
    anytime: [],
  };

  const activeHabits = input.habits.filter(
    (habit) => habit.is_active && !isHabitEffectivelyPaused(habit, input.today),
  );

  for (const habit of activeHabits) {
    const status = getHabitTodayState(habit, input.logs, input.today);
    const streak = computeStreak(
      habit.id,
      habit.recurrence_type,
      habit.recurrence_config,
      input.logs,
      input.today,
      {
        trackingType: habit.tracking_type,
        defaultTargetValue: habit.default_target_value,
        targetDirection: habit.target_direction,
      },
    );

    const habitLinkedGoalIds = linksByHabit.get(habit.id) ?? [];
    const row: TodayHabitItem = {
      habit,
      status,
      currentStreak: streak.current,
      linkedGoalIds: habitLinkedGoalIds,
      linkedGoalTitles: habitLinkedGoalIds
        .map((goalId) => goalById.get(goalId)?.title)
        .filter((title): title is string => Boolean(title)),
      stackCueFromTitles: (stackCueByHabitId.get(habit.id) ?? [])
        .map((precedingHabitId) => habitById.get(precedingHabitId)?.title)
        .filter((title): title is string => Boolean(title)),
    };

    habitGroups[bucketFromCueTime(habit.cue_time)].push(row);
  }

  const todosToday = input.todos
    .filter((todo) => todo.start_datetime.startsWith(input.today))
    .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));

  const goalProgress = input.goals.map((goal) =>
    calculateGoalProgress(goal, input.logs, [
      ...(linkedHabitsByGoal.get(goal.id) ?? []),
      ...(linkedTodosByGoal.get(goal.id) ?? []),
    ]),
  );

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
