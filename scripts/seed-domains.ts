import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DOMAINS = [
  {
    name: 'Frontend Development',
    slug: 'frontend',
    description: 'Learn to build user interfaces and client-side applications.',
    icon_name: 'Layout',
    color_hex: '#3b82f6',
    display_order: 10,
    is_published: true
  },
  {
    name: 'Backend Development',
    slug: 'backend',
    description: 'Master server-side programming, databases, and APIs.',
    icon_name: 'Server',
    color_hex: '#10b981',
    display_order: 20,
    is_published: true
  },
  {
    name: 'DevOps & Cloud',
    slug: 'devops',
    description: 'Learn deployment, CI/CD, and cloud infrastructure.',
    icon_name: 'Cloud',
    color_hex: '#8b5cf6',
    display_order: 30,
    is_published: true
  }
];

export async function seedDomains() {
  console.log('Seeding Domains...');
  
  for (const domain of DOMAINS) {
    const { data: existing, error: findError } = await supabase
      .from('domains')
      .select('id')
      .eq('slug', domain.slug)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 is not found
      console.error(`Error finding domain ${domain.slug}:`, findError);
      continue;
    }

    if (!existing) {
      const { error } = await supabase
        .from('domains')
        .insert(domain);
      
      if (error) {
        console.error(`Error inserting domain ${domain.name}:`, error);
      } else {
        console.log(`✓ Inserted domain: ${domain.name}`);
      }
    } else {
      console.log(`- Domain already exists: ${domain.name}`);
    }
  }
}

// Standalone execution support
if (require.main === module) {
  seedDomains().then(() => process.exit(0)).catch(console.error);
}
