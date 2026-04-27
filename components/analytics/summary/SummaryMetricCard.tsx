interface SummaryMetricCardProps {
  label: string;
  value: string;
  subline: string;
  emphasized?: boolean;
  progressValue?: number;
}

export function formatScoreDelta(delta: number, unit = "") {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}${unit} vs prev. period`;
}

export function SummaryMetricCard({
  label,
  value,
  subline,
  emphasized = false,
  progressValue,
}: SummaryMetricCardProps) {
  const clampedProgress =
    typeof progressValue === "number"
      ? Math.min(100, Math.max(0, progressValue))
      : null;

  return (
    <div className={`flex flex-col ${emphasized ? "surface-card-elevated p-3" : "surface-card p-3"}`}>
      <p className="text-eyebrow">{label}</p>
      <p className="text-display-sm mt-1 text-[28px] text-ink">{value}</p>

      {clampedProgress !== null && (
        <div
          className="mt-2 h-[5px] w-full overflow-hidden rounded-full bg-hairline"
          role="progressbar"
          aria-label={`${label} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clampedProgress}
        >
          <div
            className="h-full rounded-full bg-ember transition-smooth"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      )}

      <p className="mt-auto pt-2 text-[11px] text-ink-subtle">{subline}</p>
    </div>
  );
}
