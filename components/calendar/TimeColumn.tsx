import { cn } from "@/lib/utils";

interface TimeColumnProps {
  className?: string;
}

export function TimeColumn({ className }: TimeColumnProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className={cn("flex w-14 flex-col bg-background", className)}>
      <div className="h-12" />
      {hours.map((h) => (
        <div key={h} className="relative flex h-14 items-start justify-end pr-2">
          {h > 0 && (
            <span className="text-eyebrow absolute -top-2 right-2 !text-[10px]">
              {String(h).padStart(2, "0")}:00
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
