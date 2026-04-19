"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CalendarItem } from "@/lib/types";

interface LogFormProps {
  item: CalendarItem;
  unit?: string;
  onSubmit: (value: number, note?: string) => void;
}

export function LogForm({ item: _item, unit, onSubmit }: LogFormProps) {
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(parseFloat(value), note || undefined);
      }}
      className="flex flex-col gap-3"
    >
      <div>
        <Label>Value{unit ? ` (${unit})` : ""}</Label>
        <Input
          type="number"
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div>
        <Label>Note (optional)</Label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
        />
      </div>

      <Button type="submit" size="sm">
        Log value
      </Button>
    </form>
  );
}
