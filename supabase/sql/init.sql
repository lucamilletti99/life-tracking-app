begin;

create extension if not exists "uuid-ossp";

create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  title text not null,
  description text,
  goal_type text not null check (goal_type in ('target','accumulation','limit')),
  unit text not null,
  target_value numeric not null,
  baseline_value numeric,
  current_value_cache numeric,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  title text not null,
  description text,
  cue_time time,
  cue_location text,
  cue_context text,
  implementation_intention text,
  minimum_version text,
  environment_setup text,
  identity_statement text,
  temptation_bundle text,
  tracking_type text not null check (tracking_type in ('boolean','numeric','amount','duration','measurement')),
  unit text check (tracking_type <> 'measurement' or (unit is not null and btrim(unit) <> '')),
  recurrence_type text not null check (recurrence_type in ('daily','weekdays','times_per_week','times_per_month','day_of_month')),
  recurrence_config jsonb not null default '{}',
  default_target_value numeric,
  target_direction text not null default 'at_least' check (target_direction in ('at_least','at_most')),
  auto_create_calendar_instances boolean not null default true,
  is_paused boolean not null default false,
  paused_until date,
  difficulty_rating int check (difficulty_rating between 1 and 5),
  sort_order int not null default 0,
  category text,
  color_tag text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists todos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  title text not null,
  description text,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  all_day boolean not null default false,
  status text not null default 'pending' check (status in ('pending','complete','skipped')),
  source_type text not null default 'manual' check (source_type in ('manual','habit_instance')),
  source_habit_id uuid references habits(id) on delete set null,
  requires_numeric_log boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists log_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  entry_date date not null,
  entry_datetime timestamptz not null,
  source_type text not null check (source_type in ('habit','todo','manual')),
  source_id uuid,
  numeric_value numeric,
  unit text,
  note text,
  goal_ids uuid[] not null default '{}',
  completion_photo_url text,
  mood_rating int check (mood_rating between 1 and 5),
  difficulty_felt int check (difficulty_felt between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists habit_goal_links (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid not null references habits(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(habit_id, goal_id)
);

create table if not exists todo_goal_links (
  id uuid primary key default uuid_generate_v4(),
  todo_id uuid not null references todos(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(todo_id, goal_id)
);

create table if not exists habit_occurrences (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid not null references habits(id) on delete cascade,
  scheduled_date date not null,
  scheduled_start_datetime timestamptz,
  scheduled_end_datetime timestamptz,
  status text not null default 'pending' check (status in ('pending','complete','skipped')),
  linked_todo_id uuid references todos(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists habit_stacks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  preceding_habit_id uuid not null references habits(id) on delete cascade,
  following_habit_id uuid not null references habits(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique(preceding_habit_id, following_habit_id)
);

create table if not exists weekly_reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  week_start date not null,
  reflection_text text,
  habits_to_keep text[],
  habits_to_stop text[],
  habits_to_start text[],
  overall_score int,
  created_at timestamptz not null default now(),
  check (overall_score between 1 and 10)
);

commit;
