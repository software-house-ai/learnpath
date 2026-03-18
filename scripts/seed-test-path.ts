import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log('Seeding dummy path for testing...');

  const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id').limit(1);
  if (profileErr || !profiles || profiles.length === 0) {
    console.error('No profiles found. Please login to the app first.');
    process.exit(1);
  }
  const userId = profiles[0].id;
  console.log(`Found user: ${userId}`);

  const { data: goals } = await supabase.from('learning_goals').select('id').limit(1);
  const { data: skills } = await supabase.from('skills').select('id').limit(1);
  const goalId = goals?.[0]?.id;
  const skillId = skills?.[0]?.id;

  if (!goalId || !skillId) {
    console.error('No goals or skills found. Run npm run db:seed first.');
    process.exit(1);
  }

  const { data: content, error: cErr } = await supabase.from('content_items').insert({
    skill_id: skillId,
    title: 'Learn React in 100 Seconds',
    description: 'A brief introduction to React.',
    content_type: 'video',
    url: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM',
    embed_url: 'https://www.youtube.com/embed/Tn6-PIqc4UM',
    provider: 'YouTube',
    duration_minutes: 2,
    difficulty_level: 'beginner',
    thumbnail_url: 'https://img.youtube.com/vi/Tn6-PIqc4UM/maxresdefault.jpg'
  }).select('id').single();
  
  if (cErr) throw cErr;
  const contentId = content.id;
  console.log('Created dummy content item');

  const { data: path, error: pErr } = await supabase.from('paths').insert({
    user_id: userId,
    goal_id: goalId,
    title: 'My Custom Test Path',
    status: 'active',
    estimated_completion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    total_estimated_hours: 10
  }).select('id').single();
  
  if (pErr) throw pErr;
  const pathId = path.id;
  console.log('Created dummy path');

  const { data: module, error: mErr } = await supabase.from('path_modules').insert({
    path_id: pathId,
    skill_id: skillId,
    module_order: 1,
    title: 'Module 1: Getting Started',
    status: 'available',
    estimated_hours: 2
  }).select('id').single();
  
  if (mErr) throw mErr;
  const moduleId = module.id;
  console.log('Created dummy module');

  const { error: pcaErr } = await supabase.from('path_content_assignments').insert({
    path_module_id: moduleId,
    content_item_id: contentId,
    order_in_module: 1,
    is_required: true
  });
  if (pcaErr) throw pcaErr;
  console.log('Assigned content to module');

  console.log('\n==== TEST DATA SEEDED SUCCESSFULLY ====');
  console.log(`Path ID: ${pathId}`);
  console.log(`\nNavigate to: http://localhost:3000/paths/${pathId}/learn/${moduleId}/${contentId}`);
}

main();