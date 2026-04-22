import type { CalendarItem } from "@/lib/types";

interface MonthViewProps {
  currentDate: Date;
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  onDateClick: (date: Date) => void;
}

export function MonthView(props: MonthViewProps) {
  void props;

  return (
    <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
      Month view - coming in V1.1
    </div>
  );
}
