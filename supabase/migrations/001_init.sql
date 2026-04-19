create extension if not exists "uuid-ossp";

create table goals (
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

create table habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  title text not null,
  description text,
  tracking_type text not null check (tracking_type in ('boolean','numeric','amount','duration','measurement')),
  unit text,
  recurrence_type text not null check (recurrence_type in ('daily','weekdays','times_per_week','times_per_month','day_of_month')),
  recurrence_config jsonb not null default '{}',
  default_target_value numeric,
  auto_create_calendar_instances boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table habit_goal_links (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid not null references habits(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(habit_id, goal_id)
);

create table todos (
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

create table todo_goal_links (
  id uuid primary key default uuid_generate_v4(),
  todo_id uuid not null references todos(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(todo_id, goal_id)
);

create table log_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  entry_date date not null,
  entry_datetime timestamptz not null,
  source_type text not null check (source_type in ('habit','todo','manual')),
  source_id uuid,
  numeric_value numeric,
  unit text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table habit_occurrences (
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
