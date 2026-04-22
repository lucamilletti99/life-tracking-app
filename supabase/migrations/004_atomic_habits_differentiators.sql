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
