import { format, parseISO } from "date-fns";

interface TodayHeaderProps {
  today: string;
  totalHabits: number;
  completedHabits: number;
  habitsWithActiveStreak: number;
}

export function TodayHeader({
  today,
  totalHabits,
  completedHabits,
  habitsWithActiveStreak,
}: TodayHeaderProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">{format(parseISO(today), "EEEE, MMM d, yyyy")}</p>
      <h2 className="mt-1 text-lg font-semibold text-neutral-900">Today</h2>
      <p className="mt-2 text-sm text-neutral-600">
        {completedHabits}/{totalHabits} habits done · {habitsWithActiveStreak} active streaks
      </p>
    </section>
  );
}
