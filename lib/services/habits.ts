import type { Habit } from "../types";
import { mockHabits, mockHabitGoalLinks } from "../mock-data";

let habits = [...mockHabits];
let links = [...mockHabitGoalLinks];

export const habitsService = {
  list: (): Habit[] => habits.filter((h) => h.is_active),
  get: (id: string): Habit | undefined => habits.find((h) => h.id === id),
  create: (data: Omit<Habit, "id" | "created_at" | "updated_at">): Habit => {
    const habit: Habit = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    habits = [...habits, habit];
    return habit;
  },
  update: (id: string, data: Partial<Habit>): Habit => {
    habits = habits.map((h) =>
      h.id === id ? { ...h, ...data, updated_at: new Date().toISOString() } : h,
    );
    return habits.find((h) => h.id === id)!;
  },
  archive: (id: string): void => {
    habits = habits.map((h) => (h.id === id ? { ...h, is_active: false } : h));
  },
  getLinkedGoalIds: (habitId: string): string[] =>
    links.filter((l) => l.habit_id === habitId).map((l) => l.goal_id),
  linkGoal: (habitId: string, goalId: string): void => {
    if (!links.find((l) => l.habit_id === habitId && l.goal_id === goalId)) {
      links = [
        ...links,
        {
          id: crypto.randomUUID(),
          habit_id: habitId,
          goal_id: goalId,
          created_at: new Date().toISOString(),
        },
      ];
    }
  },
  unlinkGoal: (habitId: string, goalId: string): void => {
    links = links.filter((l) => !(l.habit_id === habitId && l.goal_id === goalId));
  },
};
