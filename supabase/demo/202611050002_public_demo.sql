-- Run ONLY in a separate, disposable Supabase project used for the public demo.
-- First run ../migrations/202611050001_initial.sql in that project, then enable
-- anonymous Auth sign-ins in its dashboard. Never run this in the main project.
-- Supabase anonymous Auth users have the authenticated Postgres role and a JWT
-- is_anonymous claim. This project has no private instructor or student data.

create or replace function public.is_instructor()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.instructor_users where user_id = (select auth.uid())
  ) or coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') = 'true';
$$;
