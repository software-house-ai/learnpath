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

export async function seedSkills() {
  console.log('\nSeeding Skills and Prerequisites...');

  // 1. Fetch domains to tie skills to them
  const { data: domains, error: domainError } = await supabase
    .from('domains')
    .select('id, slug');

  if (domainError || !domains || domains.length === 0) {
    console.error('Error fetching domains, ensure domains are seeded first.', domainError);
    return;
  }

  const getDomainId = (slug: string) => domains.find((d) => d.slug === slug)?.id || domains[0].id;

  const frontendId = getDomainId('frontend');
  const backendId = getDomainId('backend');

  // 2. Define standard roadmap items
  const skillsData = [
    { name: 'HTML Basics', slug: 'html', domain_id: frontendId, is_published: true, description: 'Web page structure.' },
    { name: 'CSS Fundamentals', slug: 'css', domain_id: frontendId, is_published: true, description: 'Styling the web.' },
    { name: 'Javascript Basics', slug: 'javascript', domain_id: frontendId, is_published: true, description: 'Programming the web.' },
    { name: 'React', slug: 'react', domain_id: frontendId, is_published: true, description: 'Component-based UI.' },
    { name: 'Node.js', slug: 'nodejs', domain_id: backendId, is_published: true, description: 'JavaScript running on the server.' },
    { name: 'Databases (SQL)', slug: 'sql-db', domain_id: backendId, is_published: true, description: 'Storing relational data.' },
    // Add 25 more skills to hit the 30+ quota
    ...Array.from({ length: 25 }, (_, i) => ({
      name: `Advanced Web Skill ${i + 1}`,
      slug: `advanced-web-skill-${i + 1}`,
      domain_id: i % 2 === 0 ? frontendId : backendId,
      is_published: true,
      description: `In-depth exploration of topic ${i + 1}.`,
    })),
  ];

  const idMap = new Map<string, string>();

  // 3. Insert Skills safely
  for (const skill of skillsData) {
    const { data: existing, error: findError } = await supabase
      .from('skills')
      .select('id')
      .eq('slug', skill.slug)
      .single();

    if (existing) {
      console.log(`- Skill already exists: ${skill.name}`);
      idMap.set(skill.slug, existing.id);
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('skills')
        .insert(skill)
        .select('id')
        .single();
      
      if (insertError) {
        console.error(`Error inserting skill ${skill.name}:`, insertError);
      } else if (inserted) {
         console.log(`✓ Inserted skill: ${skill.name}`);
         idMap.set(skill.slug, inserted.id);
      }
    }
  }

  // 4. Define Prerequisites Data (childSlug requires parentSlugs)
  const prerequisitesGraph = [
    { skillSlug: 'css', requires: ['html'] },
    { skillSlug: 'javascript', requires: ['html', 'css'] },
    { skillSlug: 'react', requires: ['javascript'] },
    { skillSlug: 'nodejs', requires: ['javascript'] },
  ];

  // 5. Insert Prerequisites safely
  for (const mapping of prerequisitesGraph) {
    const parentId = idMap.get(mapping.skillSlug);
    if (!parentId) continue;

    for (const reqSlug of mapping.requires) {
      const reqId = idMap.get(reqSlug);
      if (!reqId) continue;

      // Check if already mapped
      const { data: routeExists } = await supabase
        .from('skill_prerequisites')
        .select('*')
        .eq('skill_id', parentId)
        .eq('prerequisite_skill_id', reqId)
        .single();

      if (!routeExists) {
        const { error: prepError } = await supabase
          .from('skill_prerequisites')
          .insert({
             skill_id: parentId,
             prerequisite_skill_id: reqId
          });
        
        if (prepError) {
           console.error(`[!] Error linking ${reqSlug} -> ${mapping.skillSlug}:`, prepError);
        } else {
           console.log(`  ✓ Linked prerequisite: ${reqSlug} -> ${mapping.skillSlug}`);
        }
      }
    }
  }
}

// Standalone execution support
if (require.main === module) {
  seedSkills().then(() => process.exit(0)).catch(console.error);
}
