update habits
set unit = 'units'
where tracking_type = 'measurement'
  and (unit is null or btrim(unit) = '');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'habits_measurement_unit_required_chk'
  ) then
    alter table habits
      add constraint habits_measurement_unit_required_chk
      check (
        tracking_type <> 'measurement'
        or (unit is not null and btrim(unit) <> '')
      );
  end if;
end
$$;
