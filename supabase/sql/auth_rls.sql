begin;

-- Backfill legacy rows to the earliest authenticated user.
do $$
declare
  first_user_id uuid;
begin
  select id
    into first_user_id
  from auth.users
  order by created_at asc
  limit 1;

  if first_user_id is not null then
    update goals set user_id = first_user_id where user_id is null;
    update habits set user_id = first_user_id where user_id is null;
    update todos set user_id = first_user_id where user_id is null;
    update log_entries set user_id = first_user_id where user_id is null;
    update habit_stacks set user_id = first_user_id where user_id is null;
    update weekly_reviews set user_id = first_user_id where user_id is null;
  end if;
end
$$;

alter table goals alter column user_id set default auth.uid();
alter table habits alter column user_id set default auth.uid();
alter table todos alter column user_id set default auth.uid();
alter table log_entries alter column user_id set default auth.uid();
alter table habit_stacks alter column user_id set default auth.uid();
alter table weekly_reviews alter column user_id set default auth.uid();

alter table goals enable row level security;
alter table habits enable row level security;
alter table todos enable row level security;
alter table log_entries enable row level security;
alter table habit_goal_links enable row level security;
alter table todo_goal_links enable row level security;
alter table habit_occurrences enable row level security;
alter table habit_stacks enable row level security;
alter table weekly_reviews enable row level security;

drop policy if exists "goals_owner_access" on goals;
create policy "goals_owner_access"
on goals
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "habits_owner_access" on habits;
create policy "habits_owner_access"
on habits
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "todos_owner_access" on todos;
create policy "todos_owner_access"
on todos
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "log_entries_owner_access" on log_entries;
create policy "log_entries_owner_access"
on log_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "habit_stacks_owner_access" on habit_stacks;
create policy "habit_stacks_owner_access"
on habit_stacks
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "weekly_reviews_owner_access" on weekly_reviews;
create policy "weekly_reviews_owner_access"
on weekly_reviews
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "habit_goal_links_owner_access" on habit_goal_links;
create policy "habit_goal_links_owner_access"
on habit_goal_links
for all
using (
  exists (
    select 1
    from habits
    where habits.id = habit_goal_links.habit_id
      and habits.user_id = auth.uid()
  )
  and exists (
    select 1
    from goals
    where goals.id = habit_goal_links.goal_id
      and goals.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from habits
    where habits.id = habit_goal_links.habit_id
      and habits.user_id = auth.uid()
  )
  and exists (
    select 1
    from goals
    where goals.id = habit_goal_links.goal_id
      and goals.user_id = auth.uid()
  )
);

drop policy if exists "todo_goal_links_owner_access" on todo_goal_links;
create policy "todo_goal_links_owner_access"
on todo_goal_links
for all
using (
  exists (
    select 1
    from todos
    where todos.id = todo_goal_links.todo_id
      and todos.user_id = auth.uid()
  )
  and exists (
    select 1
    from goals
    where goals.id = todo_goal_links.goal_id
      and goals.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from todos
    where todos.id = todo_goal_links.todo_id
      and todos.user_id = auth.uid()
  )
  and exists (
    select 1
    from goals
    where goals.id = todo_goal_links.goal_id
      and goals.user_id = auth.uid()
  )
);

drop policy if exists "habit_occurrences_owner_access" on habit_occurrences;
create policy "habit_occurrences_owner_access"
on habit_occurrences
for all
using (
  exists (
    select 1
    from habits
    where habits.id = habit_occurrences.habit_id
      and habits.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from habits
    where habits.id = habit_occurrences.habit_id
      and habits.user_id = auth.uid()
  )
);

commit;
