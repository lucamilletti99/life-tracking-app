interface DayStrengthCardProps {
  bestDay: string | null;
  worstDay: string | null;
}

export function DayStrengthCard({ bestDay, worstDay }: DayStrengthCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">Day strength</h3>
      <p className="mt-2 text-sm text-neutral-700">
        Best day: <span className="font-medium">{bestDay ?? "N/A"}</span>
      </p>
      <p className="text-sm text-neutral-700">
        Weakest day: <span className="font-medium">{worstDay ?? "N/A"}</span>
      </p>
    </div>
  );
}
