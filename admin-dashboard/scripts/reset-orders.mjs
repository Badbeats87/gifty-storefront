import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resetOrders() {
  try {
    console.log('🔄 Resetting transactional data...\n');

    // Delete in order of foreign key dependencies
    const tablesToClear = [
      'redemptions',
      'orders',
      'gift_cards',
      'customers',
      'transactions',
    ];

    for (const table of tablesToClear) {
      const { count, error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        console.error(`❌ Error clearing ${table}:`, error.message);
        continue;
      }

      console.log(`✅ Cleared ${table}: ${count} records deleted`);
    }

    console.log('\n✅ Reset complete! Businesses and database structure preserved.');
    console.log('📊 Dashboard is now ready for fresh testing.\n');
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  }
}

resetOrders();
