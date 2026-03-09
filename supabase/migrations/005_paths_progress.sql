-- Paths table
create table paths (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  goal_id uuid references learning_goals(id) on delete set null,
  title text not null,
  status text check (status in ('active', 'paused', 'completed', 'abandoned')) default 'active',
  generated_at timestamptz default now(),
  estimated_completion_date date,
  total_estimated_hours float default 0,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Path modules table
create table path_modules (
  id uuid primary key default uuid_generate_v4(),
  path_id uuid references paths(id) on delete cascade,
  skill_id uuid references skills(id) on delete set null,
  module_order integer not null,
  title text not null,
  status text check (status in ('locked', 'available', 'in_progress', 'completed', 'skipped')) default 'locked',
  unlock_condition jsonb default '{}',
  week_number integer default 1,
  estimated_hours float default 0,
  checkpoint_passed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Path content assignments table
create table path_content_assignments (
  id uuid primary key default uuid_generate_v4(),
  path_module_id uuid references path_modules(id) on delete cascade,
  content_item_id uuid references content_items(id) on delete cascade,
  order_in_module integer default 0,
  is_required boolean default true,
  created_at timestamptz default now()
);

-- User progress table
create table user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  content_item_id uuid references content_items(id) on delete cascade,
  path_module_id uuid references path_modules(id) on delete set null,
  status text check (status in ('not_started', 'in_progress', 'completed')) default 'not_started',
  progress_percent float default 0,
  last_position_seconds integer default 0,
  time_spent_minutes float default 0,
  completed_at timestamptz,
  notes jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, content_item_id)
);

-- Checkpoint attempts table
create table checkpoint_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  path_module_id uuid references path_modules(id) on delete cascade,
  score_percent float not null,
  passed boolean default false,
  answers jsonb default '{}',
  attempted_at timestamptz default now()
);