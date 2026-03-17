-- Enable RLS on all tables
alter table domains enable row level security;
alter table skills enable row level security;
alter table skill_prerequisites enable row level security;
alter table learning_goals enable row level security;
alter table goal_skills enable row level security;
alter table content_items enable row level security;
alter table content_ratings enable row level security;
alter table profiles enable row level security;
alter table skill_assessments enable row level security;
alter table user_streaks enable row level security;
alter table paths enable row level security;
alter table path_modules enable row level security;
alter table path_content_assignments enable row level security;
alter table user_progress enable row level security;
alter table checkpoint_attempts enable row level security;

-- DOMAINS: anyone can read published domains
create policy "Public can view published domains"
  on domains for select
  using (is_published = true);

-- Admins can do everything on domains
create policy "Admins can manage domains"
  on domains for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- SKILLS: anyone can read published skills
create policy "Public can view published skills"
  on skills for select
  using (is_published = true);

create policy "Admins can manage skills"
  on skills for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- SKILL PREREQUISITES: anyone can read
create policy "Public can view skill prerequisites"
  on skill_prerequisites for select
  using (true);

create policy "Admins can manage skill prerequisites"
  on skill_prerequisites for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- LEARNING GOALS: anyone can read published goals
create policy "Public can view published goals"
  on learning_goals for select
  using (is_published = true);

create policy "Admins can manage learning goals"
  on learning_goals for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- GOAL SKILLS: anyone can read
create policy "Public can view goal skills"
  on goal_skills for select
  using (true);

create policy "Admins can manage goal skills"
  on goal_skills for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- CONTENT ITEMS: anyone can read active content
create policy "Public can view active content"
  on content_items for select
  using (is_active = true);

create policy "Admins can manage content items"
  on content_items for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- CONTENT RATINGS: users manage their own ratings
create policy "Users can view all ratings"
  on content_ratings for select
  using (auth.uid() is not null);

create policy "Users can manage their own ratings"
  on content_ratings for all
  using (auth.uid() = user_id);

-- PROFILES: users can only see and edit their own profile
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- SKILL ASSESSMENTS: users manage their own
create policy "Users can manage their own assessments"
  on skill_assessments for all
  using (auth.uid() = user_id);

-- USER STREAKS: users manage their own
create policy "Users can manage their own streaks"
  on user_streaks for all
  using (auth.uid() = user_id);

-- PATHS: users manage their own paths
create policy "Users can manage their own paths"
  on paths for all
  using (auth.uid() = user_id);

-- PATH MODULES: users manage their own path modules
  create policy "Users can manage their own path modules"
    on path_modules for all
  using (
    exists (
      select 1 from paths
      where paths.id = path_modules.path_id
      and paths.user_id = auth.uid()
    )
  );

-- PATH CONTENT ASSIGNMENTS: users manage their own
  create policy "Users can manage their own content assignments"
    on path_content_assignments for all
  using (
    exists (
      select 1 from path_modules
      join paths on paths.id = path_modules.path_id
      where path_modules.id = path_content_assignments.path_module_id
      and paths.user_id = auth.uid()
    )
  );

-- USER PROGRESS: users manage their own progress
create policy "Users can manage their own progress"
  on user_progress for all
  using (auth.uid() = user_id);

-- CHECKPOINT ATTEMPTS: users manage their own attempts
create policy "Users can manage their own checkpoint attempts"
  on checkpoint_attempts for all
  using (auth.uid() = user_id);