begin;

drop table if exists
  todo_goal_links,
  habit_goal_links,
  habit_occurrences,
  habit_stacks,
  weekly_reviews,
  log_entries,
  todos,
  habits,
  goals
cascade;

commit;
