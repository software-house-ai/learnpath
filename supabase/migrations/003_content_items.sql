-- Content items table
create table content_items (
  id uuid primary key default uuid_generate_v4(),
  skill_id uuid references skills(id) on delete cascade,
  title text not null,
  description text,
  content_type text check (content_type in ('video', 'article', 'documentation', 'course', 'exercise', 'project', 'book_chapter')) default 'video',
  url text not null,
  embed_url text,
  provider text,
  author_name text,
  language text default 'en',
  duration_minutes integer,
  difficulty_level text check (difficulty_level in ('beginner', 'intermediate', 'advanced')) default 'beginner',
  is_free boolean default true,
  is_active boolean default true,
  last_verified_at timestamptz default now(),
  needs_review boolean default false,
  rating_avg float default 0,
  rating_count integer default 0,
  completion_rate float default 0,
  tags text[] default '{}',
  thumbnail_url text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Content ratings table
create table content_ratings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  content_item_id uuid references content_items(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  comment text,
  rated_at timestamptz default now(),
  unique (user_id, content_item_id)
);