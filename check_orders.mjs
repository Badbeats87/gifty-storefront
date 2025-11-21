import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kppdvozuesiycwdacqgf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcGR2b3p1ZXNjeWN3ZGFjcWdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQyNDk1NiwiZXhwIjoyMDc5MDAwOTU2fQ.5bYE3Wuu_V1GgZ3Zc6hxq5wcz_B8IU3H0eEGDeq4FJU'
);

console.log('=== CHECKING ORDERS AND GIFT CARDS ===\n');

// Get recent orders
const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5);

console.log('Recent Orders:');
if (orders && orders.length > 0) {
  orders.forEach(order => {
    console.log(`  - Order ID: ${order.id}`);
    console.log(`    Amount: $${order.total_amount}, Status: ${order.status}, Created: ${order.created_at}`);
  });
} else {
  console.log('  No orders found');
}

// Get total gift cards
const { data: allGiftCards } = await supabase
  .from('gift_cards')
  .select('id, amount, business_id, order_id, created_at');

const cardCount = allGiftCards ? allGiftCards.length : 0;
console.log(`\nTotal Gift Cards: ${cardCount}`);

// Get total revenue from gift cards
if (allGiftCards && allGiftCards.length > 0) {
  const totalRevenue = allGiftCards.reduce((sum, card) => sum + card.amount, 0);
  console.log(`Total Revenue from Gift Cards: $${totalRevenue.toFixed(2)}`);

  // Show recent gift cards
  console.log('\nRecent Gift Cards:');
  allGiftCards.slice(0, 5).forEach(card => {
    const orderPrefix = card.order_id ? card.order_id.slice(0, 8) : 'N/A';
    console.log(`  - Amount: $${card.amount}, Order: ${orderPrefix}, Created: ${card.created_at}`);
  });
}

// Check if there's a specific order without gift cards
console.log('\n=== Checking for Orders without Gift Cards ===');
if (orders && orders.length > 0) {
  for (const order of orders.slice(0, 3)) {
    const { count: giftCardCount } = await supabase
      .from('gift_cards')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', order.id);

    console.log(`Order ${order.id.slice(0, 8)}: ${giftCardCount} gift cards`);
    if (giftCardCount === 0 || giftCardCount === null) {
      console.log(`  ⚠️  NO GIFT CARDS for this order!`);
    }
  }
}
