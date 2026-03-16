import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function seedGoals() {
  console.log('\nSeeding Learning Goals and Target Skills...');

  // 1. Get dictionary of all skills by slug
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('id, slug');

  if (skillsError || !skills || skills.length === 0) {
    console.error('Error fetching skills. Ensure domains & skills run first.', skillsError);
    return;
  }

  const skillMap = new Map();
  skills.forEach(s => skillMap.set(s.slug, s.id));

  // 2. Define standard Goals structures mapping back to specific skill slugs
  const goalsGraph = [
    {
      title: 'Frontend React Developer',
      slug: 'frontend-react-developer',
      description: 'Master the entire React ecosystem and its fundamental underpinnings to build stellar user interfaces.',
      is_published: true,
      targetSlugs: ['html', 'css', 'javascript', 'react']
    },
    {
      title: 'Full Stack Node Developer',
      slug: 'full-stack-node-developer',
      description: 'Master an end-to-end modern stack using NodeJS and React.js simultaneously.',
      is_published: true,
      targetSlugs: ['html', 'css', 'javascript', 'react', 'nodejs', 'sql-db']
    },
    {
      title: 'Backend Database Specialist',
      slug: 'backend-database-specialist',
      description: 'Deep dive into server architecture and database management.',
      is_published: true,
      targetSlugs: ['nodejs', 'sql-db', 'advanced-web-skill-1', 'advanced-web-skill-3']
    },
    {
      title: 'Advanced Frontend Engineer',
      slug: 'advanced-frontend-engineer',
      description: 'Go beyond the basics with advanced frontend optimizations and tooling.',
      is_published: true,
      targetSlugs: ['react', 'advanced-web-skill-2', 'advanced-web-skill-4']
    }
  ];

  // 3. Insert specific learning goals safely and then mount logic
  for (const goal of goalsGraph) {
    let goalId;

    // Check if goal exists
    const { data: existing, error: findError } = await supabase
      .from('learning_goals')
      .select('id')
      .eq('slug', goal.slug)
      .single();

    if (existing) {
      console.log(`- Goal already exists: ${goal.title}`);
      goalId = existing.id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('learning_goals')
        .insert({
          title: goal.title,
          slug: goal.slug,
          description: goal.description,
          is_published: goal.is_published
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error(`Error inserting goal ${goal.title}:`, insertError);
        continue;
      }
      if (inserted) {
        console.log(`✓ Inserted Goal: ${goal.title}`);
        goalId = inserted.id;
      }
    }

    if (!goalId) continue;

    // 4. Update goal_skills mapping recursively
    for (const slug of goal.targetSlugs) {
      const sId = skillMap.get(slug);
      if (!sId) {
        console.warn(`[!] Skipping missing skill map for slug: ${slug}`);
        continue;
      }

      const { data: mapExists } = await supabase
        .from('goal_skills')
        .select('*')
        .eq('goal_id', goalId)
        .eq('skill_id', sId)
        .single();

      if (!mapExists) {
        const { error: mapErr } = await supabase
          .from('goal_skills')
          .insert({
            goal_id: goalId,
            skill_id: sId
          });

        if (mapErr) {
          console.error(`[!] Map error for ${goal.slug} <-> ${slug}:`, mapErr);
        } else {
          console.log(`  ✓ Linked Target Skill: ${slug} -> ${goal.slug}`);
        }
      }
    }
  }
}

// Standalone execution support
if (require.main === module) {
  seedGoals().then(() => process.exit(0)).catch(console.error);
}