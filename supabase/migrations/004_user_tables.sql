-- Profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text check (role in ('user', 'premium', 'admin')) default 'user',
  daily_learning_goal_minutes integer default 30,
  preferred_language text default 'en',
  timezone text,
  learning_context jsonb default '{}',
  paddle_customer_id text,
  subscription_status text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Skill assessments table
create table skill_assessments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  assessed_level text check (assessed_level in ('not_started', 'familiar', 'comfortable', 'proficient')) default 'not_started',
  assessment_method text check (assessment_method in ('ai_quiz', 'self_report', 'project_submission')) default 'self_report',
  confidence_score float default 0,
  raw_responses jsonb default '{}',
  assessed_at timestamptz default now(),
  unique (user_id, skill_id)
);

-- User streaks table
create table user_streaks (
  user_id uuid primary key references profiles(id) on delete cascade,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_activity_date date,
  total_days_active integer default 0,
  total_minutes_learned float default 0,
  updated_at timestamptz default now()
);