import type { Goal, Habit, HabitGoalLink } from "./types";

interface GroupHabitsByGoalInput {
  goals: Goal[];
  habits: Habit[];
  links: HabitGoalLink[];
}

interface HabitSection {
  goal: Goal;
  habits: Habit[];
}

interface GroupHabitsByGoalResult {
  sections: HabitSection[];
  unlinked: Habit[];
}

export function groupHabitsByGoal({
  goals,
  habits,
  links,
}: GroupHabitsByGoalInput): GroupHabitsByGoalResult {
  const habitMap = new Map(habits.map((habit) => [habit.id, habit]));
  const linkedHabitIds = new Set<string>();

  const sections: HabitSection[] = goals
    .map((goal) => {
      const seenHabitIds = new Set<string>();
      const goalHabits: Habit[] = [];

      for (const link of links) {
        if (link.goal_id !== goal.id) continue;
        if (seenHabitIds.has(link.habit_id)) continue;

        const habit = habitMap.get(link.habit_id);
        if (!habit) continue;

        seenHabitIds.add(link.habit_id);
        goalHabits.push(habit);
      }

      for (const habit of goalHabits) linkedHabitIds.add(habit.id);

      return {
        goal,
        habits: goalHabits,
      };
    })
    .filter((section) => section.habits.length > 0);

  const unlinked = habits.filter((habit) => !linkedHabitIds.has(habit.id));

  return { sections, unlinked };
}
