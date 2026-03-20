-- Enable full text search on content_items
alter table content_items 
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(provider, '') || ' ' || coalesce(author_name, ''))
  ) stored;

create index if not exists idx_content_items_search 
  on content_items using gin(search_vector);

-- Enable full text search on skills
alter table skills
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) stored;

create index if not exists idx_skills_search
  on skills using gin(search_vector);

-- Enable full text search on learning_goals  
alter table learning_goals
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored;

create index if not exists idx_goals_search
  on learning_goals using gin(search_vector);
