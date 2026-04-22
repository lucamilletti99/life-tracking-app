import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WeeklyReviewPromptProps {
  weekStart: string;
  onSave: (input: {
    week_start: string;
    reflection_text?: string;
    overall_score?: number;
    habits_to_keep?: string[];
    habits_to_stop?: string[];
    habits_to_start?: string[];
  }) => Promise<void>;
}

export function WeeklyReviewPrompt({ weekStart, onSave }: WeeklyReviewPromptProps) {
  const [reflection, setReflection] = useState("");
  const [score, setScore] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">Weekly review</h3>
      <p className="mt-1 text-xs text-neutral-500">Week of {weekStart}</p>

      <div className="mt-3 grid grid-cols-1 gap-3">
        <div>
          <Label>Reflection</Label>
          <Input
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            placeholder="What worked this week?"
          />
        </div>
        <div>
          <Label>Overall score (1-10)</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={score}
            onChange={(event) => setScore(event.target.value)}
          />
        </div>
      </div>

      <Button
        className="mt-3"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          try {
            const numericScore = score ? Number(score) : undefined;
            await onSave({
              week_start: weekStart,
              reflection_text: reflection || undefined,
              overall_score: Number.isFinite(numericScore) ? numericScore : undefined,
              habits_to_keep: [],
              habits_to_stop: [],
              habits_to_start: [],
            });
            setReflection("");
            setScore("");
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? "Saving..." : "Save weekly review"}
      </Button>
    </div>
  );
}
