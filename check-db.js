const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('Checking Supabase database...\n');

  // Get all tables
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (tablesError) {
    console.error('Error fetching tables:', tablesError);
  } else {
    console.log('📊 Tables in public schema:');
    if (tables && tables.length > 0) {
      tables.forEach((table) => {
        console.log(`  - ${table.table_name}`);
      });
    } else {
      console.log('  (none found)');
    }
  }

  // Check if orders table exists
  console.log('\n🔍 Checking specific tables:\n');

  const tablesToCheck = ['orders', 'customers', 'gift_cards', 'businesses'];

  for (const tableName of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('id', { count: 'exact' });

      if (error) {
        console.log(`  ❌ ${tableName}: NOT FOUND (${error.message})`);
      } else {
        console.log(`  ✅ ${tableName}: EXISTS (${count} rows)`);
      }
    } catch (err) {
      console.log(`  ❌ ${tableName}: ERROR - ${err.message}`);
    }
  }

  // Get columns for gift_cards table
  console.log('\n📋 gift_cards table columns:');
  const { data: columns, error: columnsError } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'gift_cards');

  if (columnsError) {
    console.log(`  Error: ${columnsError.message}`);
  } else if (columns && columns.length > 0) {
    columns.forEach((col) => {
      console.log(`  - ${col.column_name}`);
    });
  } else {
    console.log('  (table not found)');
  }
}

checkDatabase().catch(console.error);
