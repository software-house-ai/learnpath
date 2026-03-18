import { seedDomains } from './seed-domains';
import { seedSkills } from './seed-skills';
import { seedGoals } from './seed-goals';

async function main() {
  console.log('🌱 Starting full database seed...\n');
  
  try {
    // 1. Domains have no prerequisites
    await seedDomains();
    
    // 2. Skills depend on Domains (and each other)
    await seedSkills();
    
    // 3. Goals depend on Skills
    await seedGoals();
    
    console.log('\n✅ Full database seed completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during database seeding:', error);
    process.exit(1);
  }
}

// Run the script
main();