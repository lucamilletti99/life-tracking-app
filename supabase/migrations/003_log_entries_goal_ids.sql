alter table log_entries
  add column goal_ids uuid[] not null default '{}';
