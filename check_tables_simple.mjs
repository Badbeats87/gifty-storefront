import { createClient } from '@supabase/supabase-js';

// Use the anon key which worked before
const supabase = createClient(
  'https://kppdvozuesiycwdacqgf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcGR2b3p1ZXNjeWN3ZGFjcWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjQ5NTYsImV4cCI6MjA3OTAwMDk1Nn0.Gsc4qx8RK82k6pz0zoZWimXkRsN90Zz3OjvTwpZbO5c'
);

console.log('=== CHECKING AVAILABLE TABLES ===\n');

// Try each table
const tables = ['orders', 'gift_cards', 'customers', 'businesses', 'redemptions'];

for (const tableName of tables) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
    } else {
      console.log(`✅ ${tableName}: ${count} records`);
    }
  } catch (e) {
    console.log(`⚠️  ${tableName}: ${e.message}`);
  }
}

console.log('\n=== DETAILED CHECK ===');

// Get all tables info using Supabase SQL if available
try {
  const { data: businessData } = await supabase
    .from('businesses')
    .select('*')
    .limit(1);

  if (businessData && businessData.length > 0) {
    console.log('\n✅ Businesses table accessible:');
    console.log(JSON.stringify(businessData[0], null, 2));
  }
} catch (e) {
  console.log('Error accessing businesses:', e.message);
}
