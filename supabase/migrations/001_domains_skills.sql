-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Domains table
create table domains (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  slug text unique not null,
  description text,
  icon_name text,
  color_hex text default '1A56DB',
  is_published boolean default false,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Skills table
create table skills (
  id uuid primary key default uuid_generate_v4(),
  domain_id uuid references domains(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  difficulty integer check (difficulty between 1 and 5),
  estimated_hours float default 0,
  icon_name text,
  is_published boolean default false,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Skill prerequisites table
create table skill_prerequisites (
  skill_id uuid references skills(id) on delete cascade,
  prerequisite_skill_id uuid references skills(id) on delete cascade,
  strength text check (strength in ('required', 'recommended')) default 'required',
  primary key (skill_id, prerequisite_skill_id)
);