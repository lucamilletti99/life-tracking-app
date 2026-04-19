export function TimeColumn() {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex w-14 flex-col border-r border-neutral-100">
      <div className="h-10" />
      {hours.map((h) => (
        <div key={h} className="relative flex h-14 items-start justify-end pr-2">
          {h > 0 && (
            <span className="absolute -top-2 right-2 text-[10px] text-neutral-400">
              {String(h).padStart(2, "0")}:00
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
