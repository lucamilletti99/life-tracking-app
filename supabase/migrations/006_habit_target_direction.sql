alter table habits
  add column if not exists target_direction text;

update habits
set target_direction = 'at_least'
where target_direction is null;

alter table habits
  alter column target_direction set default 'at_least',
  alter column target_direction set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'habits_target_direction_chk'
  ) then
    alter table habits
      add constraint habits_target_direction_chk
      check (target_direction in ('at_least', 'at_most'));
  end if;
end
$$;
