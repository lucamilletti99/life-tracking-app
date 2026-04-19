export type GoalType = "target" | "accumulation" | "limit";
export type TrackingType =
  | "boolean"
  | "numeric"
  | "amount"
  | "duration"
  | "measurement";
export type RecurrenceType =
  | "daily"
  | "weekdays"
  | "times_per_week"
  | "times_per_month"
  | "day_of_month";
export type TodoStatus = "pending" | "complete" | "skipped";
export type SourceType = "manual" | "habit_instance";
export type LogSourceType = "habit" | "todo" | "manual";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  goal_type: GoalType;
  unit: string;
  target_value: number;
  baseline_value?: number;
  current_value_cache?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurrenceConfig {
  weekdays?: number[];
  times_per_period?: number;
  day_of_month?: number;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  tracking_type: TrackingType;
  unit?: string;
  recurrence_type: RecurrenceType;
  recurrence_config: RecurrenceConfig;
  default_target_value?: number;
  auto_create_calendar_instances: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitGoalLink {
  id: string;
  habit_id: string;
  goal_id: string;
  created_at: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
  status: TodoStatus;
  source_type: SourceType;
  source_habit_id?: string;
  requires_numeric_log: boolean;
  created_at: string;
  updated_at: string;
}

export interface TodoGoalLink {
  id: string;
  todo_id: string;
  goal_id: string;
  created_at: string;
}

export interface LogEntry {
  id: string;
  entry_date: string;
  entry_datetime: string;
  source_type: LogSourceType;
  source_id?: string;
  numeric_value?: number;
  unit?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface HabitOccurrence {
  id: string;
  habit_id: string;
  scheduled_date: string;
  scheduled_start_datetime?: string;
  scheduled_end_datetime?: string;
  status: TodoStatus;
  linked_todo_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarItem {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
  kind: "todo" | "habit_occurrence";
  status: TodoStatus;
  source_habit_id?: string;
  requires_numeric_log: boolean;
  linked_goal_ids: string[];
}

export interface GoalProgress {
  goal: Goal;
  current_value: number;
  percentage: number;
  is_on_track: boolean;
}
