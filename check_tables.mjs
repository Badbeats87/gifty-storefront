import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kppdvozuesiycwdacqgf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcGR2b3p1ZXNjeWN3ZGFjcWdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQyNDk1NiwiZXhwIjoyMDc5MDAwOTU2fQ.5bYE3Wuu_V1GgZ3Zc6hxq5wcz_B8IU3H0eEGDeq4FJU'
);

console.log('=== CHECKING TABLE STRUCTURE ===\n');

// Check orders table
try {
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  if (ordersError) {
    console.log('❌ Orders table error:', ordersError.message);
  } else {
    console.log('✅ Orders table exists');
    console.log(`   Record count: checking...`);
  }
} catch (e) {
  console.log('❌ Orders table not accessible:', e.message);
}

// Check gift_cards table
try {
  const { data: giftCards, error: giftCardsError } = await supabase
    .from('gift_cards')
    .select('*')
    .limit(1);

  if (giftCardsError) {
    console.log('❌ Gift cards table error:', giftCardsError.message);
  } else {
    console.log('✅ Gift cards table exists');
    console.log(`   Record count: checking...`);
  }
} catch (e) {
  console.log('❌ Gift cards table not accessible:', e.message);
}

// Check customers table
try {
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .limit(1);

  if (customersError) {
    console.log('❌ Customers table error:', customersError.message);
  } else {
    console.log('✅ Customers table exists');
  }
} catch (e) {
  console.log('❌ Customers table not accessible:', e.message);
}

// Check if there's data at all
const { count: orderCount } = await supabase
  .from('orders')
  .select('*', { count: 'exact', head: true });

const { count: giftCardCount } = await supabase
  .from('gift_cards')
  .select('*', { count: 'exact', head: true });

const { count: customerCount } = await supabase
  .from('customers')
  .select('*', { count: 'exact', head: true });

console.log('\n=== TOTAL RECORDS ===');
console.log(`Orders: ${orderCount}`);
console.log(`Gift Cards: ${giftCardCount}`);
console.log(`Customers: ${customerCount}`);

// Check if we can at least see businesses (which has data)
const { count: businessCount } = await supabase
  .from('businesses')
  .select('*', { count: 'exact', head: true });

console.log(`Businesses: ${businessCount} (should have data)`);
