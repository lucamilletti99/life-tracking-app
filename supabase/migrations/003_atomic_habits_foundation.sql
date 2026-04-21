alter table habits
  add column if not exists cue_time time,
  add column if not exists cue_location text,
  add column if not exists cue_context text,
  add column if not exists implementation_intention text,
  add column if not exists minimum_version text,
  add column if not exists environment_setup text,
  add column if not exists identity_statement text,
  add column if not exists temptation_bundle text,
  add column if not exists is_paused boolean not null default false,
  add column if not exists paused_until date,
  add column if not exists difficulty_rating int,
  add column if not exists sort_order int not null default 0,
  add column if not exists category text,
  add column if not exists color_tag text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'habits_difficulty_rating_range_chk'
  ) then
    alter table habits
      add constraint habits_difficulty_rating_range_chk
      check (difficulty_rating between 1 and 5);
  end if;
end
$$;

alter table log_entries
  add column if not exists completion_photo_url text,
  add column if not exists mood_rating int,
  add column if not exists difficulty_felt int;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'log_entries_mood_rating_range_chk'
  ) then
    alter table log_entries
      add constraint log_entries_mood_rating_range_chk
      check (mood_rating between 1 and 5);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'log_entries_difficulty_felt_range_chk'
  ) then
    alter table log_entries
      add constraint log_entries_difficulty_felt_range_chk
      check (difficulty_felt between 1 and 5);
  end if;
end
$$;
