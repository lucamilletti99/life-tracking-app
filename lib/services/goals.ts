import type { Goal } from "../types";
import {
  mockGoals,
  mockHabitGoalLinks,
  mockTodoGoalLinks,
} from "../mock-data";

let goals = [...mockGoals];
let habitGoalLinks = [...mockHabitGoalLinks];
let todoGoalLinks = [...mockTodoGoalLinks];

export const goalsService = {
  list: (): Goal[] => goals.filter((g) => g.is_active),
  get: (id: string): Goal | undefined => goals.find((g) => g.id === id),
  create: (data: Omit<Goal, "id" | "created_at" | "updated_at">): Goal => {
    const goal: Goal = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    goals = [...goals, goal];
    return goal;
  },
  update: (id: string, data: Partial<Goal>): Goal => {
    goals = goals.map((g) =>
      g.id === id ? { ...g, ...data, updated_at: new Date().toISOString() } : g,
    );
    return goals.find((g) => g.id === id)!;
  },
  delete: (id: string): void => {
    goals = goals.filter((g) => g.id !== id);
  },
  getLinkedHabitIds: (goalId: string): string[] =>
    habitGoalLinks
      .filter((l) => l.goal_id === goalId)
      .map((l) => l.habit_id),
  getLinkedTodoIds: (goalId: string): string[] =>
    todoGoalLinks.filter((l) => l.goal_id === goalId).map((l) => l.todo_id),
  linkHabit: (goalId: string, habitId: string): void => {
    if (!habitGoalLinks.find((l) => l.goal_id === goalId && l.habit_id === habitId)) {
      habitGoalLinks = [
        ...habitGoalLinks,
        {
          id: crypto.randomUUID(),
          goal_id: goalId,
          habit_id: habitId,
          created_at: new Date().toISOString(),
        },
      ];
    }
  },
  unlinkHabit: (goalId: string, habitId: string): void => {
    habitGoalLinks = habitGoalLinks.filter(
      (l) => !(l.goal_id === goalId && l.habit_id === habitId),
    );
  },
};
