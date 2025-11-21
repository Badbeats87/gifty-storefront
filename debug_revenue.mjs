import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kppdvozuesiycwdacqgf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcGR2b3p1ZXNjeWN3ZGFjcWdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQyNDk1NiwiZXhwIjoyMDc5MDAwOTU2fQ.5bYE3Wuu_V1GgZ3Zc6hxq5wcz_B8IU3H0eEGDeq4FJU'
);

console.log('=== CHECKING ORDERS AND GIFT CARDS ===\n');

// Get all orders
const { data: orders, count: ordersCount } = await supabase
  .from('orders')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false });

console.log(`Total Orders: ${ordersCount}`);
if (orders && orders.length > 0) {
  console.log('\nOrders:');
  orders.forEach(order => {
    console.log(`  ID: ${order.id.slice(0, 8)}...`);
    console.log(`    Amount: $${order.total_amount}`);
    console.log(`    Business ID: ${order.business_id}`);
    console.log(`    Created: ${order.created_at}`);
  });
}

// Get all gift cards
const { data: allGiftCards, count: cardCount } = await supabase
  .from('gift_cards')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false });

console.log(`\n\nTotal Gift Cards: ${cardCount}`);

if (allGiftCards && allGiftCards.length > 0) {
  const totalRevenue = allGiftCards.reduce((sum, card) => sum + card.amount, 0);
  console.log(`Total Revenue (sum of all gift cards): $${totalRevenue.toFixed(2)}`);

  // Group by business_id
  const byBusiness = {};
  allGiftCards.forEach(card => {
    const bid = card.business_id || 'NULL';
    if (!byBusiness[bid]) {
      byBusiness[bid] = { count: 0, total: 0 };
    }
    byBusiness[bid].count += 1;
    byBusiness[bid].total += card.amount;
  });

  console.log('\nGift Cards by Business:');
  Object.entries(byBusiness).forEach(([bid, stats]) => {
    console.log(`  Business ${bid.slice(0, 8)}: ${stats.count} cards, $${stats.total.toFixed(2)}`);
  });

  console.log('\nRecent Gift Cards:');
  allGiftCards.slice(0, 5).forEach(card => {
    console.log(`  Code: ${card.code}, Amount: $${card.amount}, Business: ${card.business_id?.slice(0, 8)}, Order: ${card.order_id?.slice(0, 8)}`);
  });
}

// Check if there's a mismatch
console.log('\n\n=== CHECKING FOR MISMATCHES ===');
if (orders && allGiftCards) {
  for (const order of orders) {
    const cardsForOrder = allGiftCards.filter(c => c.order_id === order.id);
    console.log(`\nOrder ${order.id.slice(0, 8)}: Expected gift cards for $${order.total_amount}, Found ${cardsForOrder.length} cards`);
    if (cardsForOrder.length === 0) {
      console.log(`  ⚠️  NO GIFT CARDS FOUND FOR THIS ORDER!`);
    } else {
      const cardTotal = cardsForOrder.reduce((sum, c) => sum + c.amount, 0);
      console.log(`  Card total: $${cardTotal.toFixed(2)} (${order.total_amount === cardTotal ? '✅ MATCHES' : `❌ MISMATCH - expected $${order.total_amount}` })`);
    }
  }
}
