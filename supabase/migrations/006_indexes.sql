-- Indexes for performance
create index idx_skills_domain_id on skills(domain_id);
create index idx_skills_slug on skills(slug);
create index idx_content_items_skill_id on content_items(skill_id);
create index idx_content_items_difficulty on content_items(difficulty_level);
create index idx_content_items_active on content_items(is_active);
create index idx_content_items_needs_review on content_items(needs_review);
create index idx_paths_user_id on paths(user_id);
create index idx_paths_status on paths(status);
create index idx_path_modules_path_id on path_modules(path_id);
create index idx_path_modules_status on path_modules(status);
create index idx_user_progress_user_id on user_progress(user_id);
create index idx_user_progress_status on user_progress(status);
create index idx_skill_assessments_user_id on skill_assessments(user_id);
create index idx_learning_goals_domain_id on learning_goals(domain_id);
create index idx_learning_goals_slug on learning_goals(slug);