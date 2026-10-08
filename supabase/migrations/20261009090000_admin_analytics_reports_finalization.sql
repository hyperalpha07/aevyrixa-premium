-- Admin V2 Analytics/Reports finalization.
-- Small additive permission catalog update only; no analytics/report data tables,
-- no order/customer/review rewrites, no schema changes, and no new runtime grants.

do $$
begin
  if to_regclass('public.admin_roles') is not null then
    update public.admin_roles
      set permissions = coalesce(permissions, '{}'::jsonb) || '{"reports.export": true}'::jsonb
      where key = 'manager' and is_system = true;
  end if;
end $$;
