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
  const completionRate =
    totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  const nudge =
    habitsWithActiveStreak >= 5
      ? "Compounding in progress — protect your streaks today."
      : habitsWithActiveStreak > 0
        ? "Momentum is alive. Lock in your next rep."
        : "Start with one easy win to begin the streak.";

  const date = parseISO(today);

  return (
    <section className="border-b border-hairline pb-12">
      <p className="text-eyebrow">{format(date, "EEEE")}</p>
      <h2 className="text-display mt-4 text-[76px] text-ink">
        {format(date, "MMMM d")}
        <span className="text-ink-subtle">.</span>
      </h2>
      <p className="mt-4 max-w-xl text-[14px] leading-6 text-ink-muted">{nudge}</p>

      <div
        aria-label="Daily summary"
        className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <Metric label="Completed" value={`${completedHabits}`} suffix={` / ${totalHabits}`} />
        <Metric label="Completion" value={`${completionRate}`} suffix="%" />
        <Metric
          label="Active streaks"
          value={`${habitsWithActiveStreak}`}
          accent={habitsWithActiveStreak > 0}
        />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  suffix,
  accent = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="surface-card px-6 py-5">
      <p className="text-eyebrow">{label}</p>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span
          className={`text-metric text-[32px] font-medium leading-none ${accent ? "text-ember" : "text-ink"}`}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-metric text-[14px] text-ink-subtle">{suffix}</span>
        )}
      </p>
    </div>
  );
}
