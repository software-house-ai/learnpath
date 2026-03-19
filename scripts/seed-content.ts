import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { bulkImportContent } from '../lib/content/bulk-importer';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function seedContent() {
  console.log('Seeding Content from JSON files...');

  const seedDir = path.resolve(process.cwd(), 'supabase', 'seed');
  const files = ['content_webdev.json', 'content_python.json', 'content_dsa.json', 'content_datascience.json'];

  const { data: skills } = await supabase.from('skills').select('id, slug');
  const skillMap = (skills || []).reduce((acc: any, s: any) => {
    acc[s.slug] = s.id;
    return acc;
  }, {});

  for (const file of files) {
    const filePath = path.join(seedDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`âš ï¸  Seed file not found: ${file}`);
      continue;
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const items = JSON.parse(fileContent);
      console.log(`Processing ${items.length} items from ${file}...`);
      
      const result = await bulkImportContent(items, supabase, skillMap);
      
      console.log(`✅ Imported ${result.imported} items from ${file}. Skipped ${result.skipped} duplicates.`);
      if (result.failed > 0) {
          console.warn(`âš ï¸  Failed to import ${result.failed} items from ${file}.`);
          console.warn(`Errors:`, result.errors);
      }

    } catch (e) {
      console.error(`Error processing file ${file}:`, e);
    }
  }
}

// Standalone execution support
if (require.main === module) {
  seedContent().then(() => process.exit(0)).catch(console.error);
}