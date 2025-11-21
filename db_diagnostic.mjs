import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kppdvozuesiycwdacqgf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
console.log('║                     DATABASE DIAGNOSTIC                          ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

// Check businesses
console.log('📊 BUSINESSES TABLE:');
console.log('─'.repeat(65));
const { data: allBusinesses, error: businessError } = await supabase
  .from('businesses')
  .select('id, name, slug, status, is_active, is_visible, created_at')
  .order('created_at', { ascending: false });

if (businessError) {
  console.log(`❌ Error: ${businessError.message}`);
} else {
  console.log(`Total businesses: ${allBusinesses?.length || 0}`);
  if (allBusinesses && allBusinesses.length > 0) {
    console.log('\nFirst 5 businesses:');
    allBusinesses.slice(0, 5).forEach((b, i) => {
      console.log(`\n  ${i+1}. ${b.name}`);
      console.log(`     ID: ${b.id.substring(0, 8)}...`);
      console.log(`     Slug: ${b.slug}`);
      console.log(`     Status: ${b.status}`);
      console.log(`     Active: ${b.is_active}`);
      console.log(`     Visible: ${b.is_visible}`);
      console.log(`     Created: ${new Date(b.created_at).toLocaleDateString()}`);
    });
  }
}

// Check business credentials
console.log('\n\n🔐 BUSINESS CREDENTIALS TABLE:');
console.log('─'.repeat(65));
const { data: credentials, error: credError } = await supabase
  .from('business_credentials')
  .select('email')
  .limit(5);

if (credError) {
  console.log(`❌ Error: ${credError.message}`);
} else {
  console.log(`Total credentials: ${credentials?.length || 0}`);
  if (credentials && credentials.length > 0) {
    credentials.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.email}`);
    });
  }
}

// Check orders
console.log('\n\n📦 ORDERS TABLE:');
console.log('─'.repeat(65));
const { data: orders, error: orderError } = await supabase
  .from('orders')
  .select('id, business_id, total_amount, status, created_at')
  .order('created_at', { ascending: false })
  .limit(10);

if (orderError) {
  console.log(`❌ Error: ${orderError.message}`);
} else {
  console.log(`Total orders: ${orders?.length || 0}`);
  if (orders && orders.length > 0) {
    console.log(`\nRecent orders:`);
    orders.forEach((o, i) => {
      console.log(`\n  ${i+1}. Order ${o.id.substring(0, 8)}...`);
      console.log(`     Business ID: ${o.business_id ? o.business_id.substring(0, 8) + '...' : 'NULL'}`);
      console.log(`     Amount: $${o.total_amount}`);
      console.log(`     Status: ${o.status}`);
      console.log(`     Created: ${new Date(o.created_at).toLocaleDateString()}`);
    });
  }
}

// Check gift cards
console.log('\n\n🎁 GIFT CARDS TABLE:');
console.log('─'.repeat(65));
const { data: giftCards, error: gcError } = await supabase
  .from('gift_cards')
  .select('id, business_id, code, amount, status, issued_at')
  .order('issued_at', { ascending: false })
  .limit(10);

if (gcError) {
  console.log(`❌ Error: ${gcError.message}`);
} else {
  console.log(`Total gift cards: ${giftCards?.length || 0}`);
  if (giftCards && giftCards.length > 0) {
    console.log(`\nRecent gift cards:`);
    giftCards.forEach((g, i) => {
      console.log(`\n  ${i+1}. ${g.code}`);
      console.log(`     Business ID: ${g.business_id ? g.business_id.substring(0, 8) + '...' : 'NULL'}`);
      console.log(`     Amount: $${g.amount}`);
      console.log(`     Status: ${g.status}`);
      console.log(`     Issued: ${new Date(g.issued_at).toLocaleDateString()}`);
    });
  }
}

// Check customers
console.log('\n\n👥 CUSTOMERS TABLE:');
console.log('─'.repeat(65));
const { data: customers, error: custError } = await supabase
  .from('customers')
  .select('id, email, created_at')
  .order('created_at', { ascending: false })
  .limit(5);

if (custError) {
  console.log(`❌ Error: ${custError.message}`);
} else {
  console.log(`Total customers: ${customers?.length || 0}`);
  if (customers && customers.length > 0) {
    customers.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.email}`);
    });
  }
}

console.log('\n' + '─'.repeat(65));
console.log('✅ Database diagnostic complete\n');
