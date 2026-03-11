-- Fix: infinite recursion in profiles RLS policy.
-- The "Admins can view all profiles" policy referenced profiles within itself.
-- All admin policies that do `exists (select 1 from profiles ...)` hit the same loop.
--
-- Solution: create a SECURITY DEFINER function `is_admin()`.
-- SECURITY DEFINER runs as the function owner (postgres), bypassing RLS entirely,
-- so there is no recursive policy evaluation.

create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

-- ── PROFILES ──────────────────────────────────────────────────────────────────
drop policy if exists "Admins can view all profiles" on profiles;

create policy "Admins can view all profiles"
  on profiles for select
  using (is_admin());

-- ── DOMAINS ───────────────────────────────────────────────────────────────────
drop policy if exists "Admins can manage domains" on domains;

create policy "Admins can manage domains"
  on domains for all
  using (is_admin());

-- ── SKILLS ────────────────────────────────────────────────────────────────────
drop policy if exists "Admins can manage skills" on skills;

create policy "Admins can manage skills"
  on skills for all
  using (is_admin());

-- ── SKILL PREREQUISITES ───────────────────────────────────────────────────────
drop policy if exists "Admins can manage skill prerequisites" on skill_prerequisites;

create policy "Admins can manage skill prerequisites"
  on skill_prerequisites for all
  using (is_admin());

-- ── LEARNING GOALS ────────────────────────────────────────────────────────────
drop policy if exists "Admins can manage learning goals" on learning_goals;

create policy "Admins can manage learning goals"
  on learning_goals for all
  using (is_admin());

-- ── GOAL SKILLS ───────────────────────────────────────────────────────────────
drop policy if exists "Admins can manage goal skills" on goal_skills;

create policy "Admins can manage goal skills"
  on goal_skills for all
  using (is_admin());

-- ── CONTENT ITEMS ─────────────────────────────────────────────────────────────
drop policy if exists "Admins can manage content items" on content_items;

create policy "Admins can manage content items"
  on content_items for all
  using (is_admin());
