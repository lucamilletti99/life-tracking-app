import { format } from "date-fns";

import type { CalendarItem } from "@/lib/types";

interface DayViewProps {
  date: Date;
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
}

export function DayView({ date, items, onItemClick }: DayViewProps) {
  const dayItems = items.filter((i) =>
    i.start_datetime.startsWith(format(date, "yyyy-MM-dd")),
  );

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-6">
      <h2 className="text-lg font-semibold text-neutral-900">
        {format(date, "EEEE, MMMM d")}
      </h2>
      {dayItems.length === 0 ? (
        <p className="text-sm text-neutral-400">Nothing scheduled for this day.</p>
      ) : (
        dayItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left hover:shadow-sm"
          >
            <p className="text-sm font-medium text-neutral-900">{item.title}</p>
            <p className="text-xs text-neutral-400">
              {item.start_datetime.slice(11, 16)} - {item.end_datetime.slice(11, 16)}
            </p>
          </button>
        ))
      )}
    </div>
  );
}
