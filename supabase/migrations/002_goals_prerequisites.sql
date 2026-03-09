-- Learning goals table
create table learning_goals (
  id uuid primary key default uuid_generate_v4(),
  domain_id uuid references domains(id) on delete cascade,
  title text not null,
  slug text unique not null,
  description text,
  difficulty text check (difficulty in ('beginner_friendly', 'some_experience_needed', 'intermediate')) default 'beginner_friendly',
  estimated_weeks integer default 12,
  is_published boolean default false,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Goal skills junction table
create table goal_skills (
  goal_id uuid references learning_goals(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  display_order integer default 0,
  is_core boolean default true,
  primary key (goal_id, skill_id)
);