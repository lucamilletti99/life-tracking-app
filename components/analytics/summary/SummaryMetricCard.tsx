interface SummaryMetricCardProps {
  label: string;
  value: string;
  subline: string;
  emphasized?: boolean;
  progressValue?: number;
}

export function formatScoreDelta(delta: number) {
  const signed = delta > 0 ? `+${delta}` : `${delta}`;
  return `${signed} vs previous period`;
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
    <div className={emphasized ? "surface-card-elevated p-4" : "surface-card p-4"}>
      <p className="text-eyebrow">{label}</p>
      <p className="text-display-sm mt-1 text-[30px] text-ink">{value}</p>

      {clampedProgress !== null && (
        <div
          className="mt-3 h-[6px] w-full overflow-hidden rounded-full bg-hairline"
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

      <p className="mt-2 text-[12px] text-ink-subtle">{subline}</p>
    </div>
  );
}
