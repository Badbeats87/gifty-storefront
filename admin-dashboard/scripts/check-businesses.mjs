import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: businesses, error } = await supabase
  .from('businesses')
  .select('id, name, status, created_at')
  .order('created_at', { ascending: false });

if (error) {
  console.error('❌ Error:', error.message);
} else {
  console.log(`\n📊 Found ${businesses.length} business(es):\n`);
  if (businesses.length === 0) {
    console.log('  No businesses in database yet.\n');
  } else {
    businesses.forEach((biz, i) => {
      console.log(`  ${i + 1}. ${biz.name} (${biz.status})`);
      console.log(`     ID: ${biz.id}`);
      console.log(`     Created: ${new Date(biz.created_at).toLocaleDateString()}\n`);
    });
  }
}
