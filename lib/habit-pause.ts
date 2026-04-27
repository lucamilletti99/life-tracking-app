import type { Habit } from "./types";

export function isHabitEffectivelyPaused(
  habit: Pick<Habit, "is_paused" | "paused_until">,
  today: string,
): boolean {
  if (!habit.is_paused) return false;
  if (!habit.paused_until) return true;

  return habit.paused_until >= today;
}
