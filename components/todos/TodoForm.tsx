"use client";

import { useState } from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Todo } from "@/lib/types";

interface TodoFormProps {
  initial?: { date?: Date; hour?: number };
  onSubmit: (data: Omit<Todo, "id" | "created_at" | "updated_at">) => void;
  onCancel: () => void;
}

export function TodoForm({ initial, onSubmit, onCancel }: TodoFormProps) {
  const defaultDate = initial?.date
    ? format(initial.date, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");
  const defaultHour = String(initial?.hour ?? 9).padStart(2, "0");

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(`${defaultHour}:00`);
  const [endTime, setEndTime] = useState(
    `${String((initial?.hour ?? 9) + 1).padStart(2, "0")}:00`,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title,
      start_datetime: `${date}T${startTime}:00`,
      end_datetime: `${date}T${endTime}:00`,
      all_day: false,
      status: "pending",
      source_type: "manual",
      requires_numeric_log: false,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
          placeholder="e.g. Grocery run"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Start time</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>End time</Label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add todo</Button>
      </div>
    </form>
  );
}
