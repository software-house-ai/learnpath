-- ============================================================
-- LearnPath — Full Database Reset
-- ============================================================
-- INSTRUCTIONS:
--   1. Paste and run THIS file in Supabase SQL Editor first.
--   2. Then run each migration in order:
--        001_domains_skills.sql
--        002_goals_prerequisites.sql
--        003_content_items.sql
--        004_user_tables.sql
--        005_paths_progress.sql
--        006_indexes.sql
--        007_rls_policies.sql
--        008_functions.sql
--        009_content_rating_function.sql
--   3. Optionally run supabase/seed/seed.sql to re-seed data.
-- ============================================================

-- ─── DROP TRIGGERS ───────────────────────────────────────────

drop trigger if exists on_auth_user_created on auth.users;

-- ─── DROP FUNCTIONS ──────────────────────────────────────────

drop function if exists public.handle_new_user() cascade;
drop function if exists public.update_content_rating(uuid) cascade;

-- ─── DROP TABLES (CASCADE handles all FK dependencies) ───────

drop table if exists checkpoint_attempts          cascade;
drop table if exists user_progress                cascade;
drop table if exists path_content_assignments     cascade;
drop table if exists path_modules                 cascade;
drop table if exists paths                        cascade;
drop table if exists skill_assessments            cascade;
drop table if exists user_streaks                 cascade;
drop table if exists content_ratings              cascade;
drop table if exists goal_skills                  cascade;
drop table if exists content_items                cascade;
drop table if exists skill_prerequisites          cascade;
drop table if exists learning_goals               cascade;
drop table if exists skills                       cascade;
drop table if exists profiles                     cascade;
drop table if exists domains                      cascade;

-- ─── DONE ─────────────────────────────────────────────────────
-- All LearnPath tables, triggers, and functions have been removed.
-- Now run migrations 001 → 009 in order.
