import { getHabitLogStatusMap, habitStatusKey } from "./habit-status";
import type { Habit, HabitStack, LogEntry } from "./types";

export function buildHabitStackCueMap(input: {
  habits: Habit[];
  stacks: HabitStack[];
  logs: LogEntry[];
  today: string;
}): Map<string, string[]> {
  const habitById = new Map(input.habits.map((habit) => [habit.id, habit]));
  const statusByOccurrence = getHabitLogStatusMap(input.logs);
  const cueByHabitId = new Map<string, string[]>();

  for (const stack of input.stacks) {
    const preceding = habitById.get(stack.preceding_habit_id);
    const following = habitById.get(stack.following_habit_id);

    if (!preceding || !following) continue;
    if (!following.is_active || following.is_paused) continue;

    const precedingStatus = statusByOccurrence.get(
      habitStatusKey(preceding.id, input.today),
    );
    const followingStatus = statusByOccurrence.get(
      habitStatusKey(following.id, input.today),
    );

    if (precedingStatus !== "complete" || followingStatus === "complete") continue;

    const current = cueByHabitId.get(following.id) ?? [];
    cueByHabitId.set(following.id, [...current, preceding.id]);
  }

  return cueByHabitId;
}
