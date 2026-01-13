import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createClientsTable() {
  console.log('Creating clients table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) DEFAULT '',
        email VARCHAR(255),
        phone VARCHAR(63),
        gender VARCHAR(10),
        birthday DATE,
        notes TEXT,
        source VARCHAR(50) DEFAULT 'amelia_import',
        amelia_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT clients_email_business_unique UNIQUE NULLS NOT DISTINCT (business_id, email)
      );
      
      CREATE INDEX IF NOT EXISTS idx_clients_business_id ON clients(business_id);
      CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email) WHERE email IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone) WHERE phone IS NOT NULL;
    `
  });
  
  if (error) {
    console.error('RPC error:', error.message);
    console.log('\nTrying direct table creation...');
    
    // Try inserting a test record to see if table exists
    const { error: testError } = await supabase
      .from('clients')
      .select('id')
      .limit(1);
    
    if (testError?.message?.includes('does not exist')) {
      console.log('\n⚠️  The clients table does not exist.');
      console.log('Please run this SQL in Supabase Dashboard > SQL Editor:\n');
      console.log(`
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) DEFAULT '',
  email VARCHAR(255),
  phone VARCHAR(63),
  gender VARCHAR(10),
  birthday DATE,
  notes TEXT,
  source VARCHAR(50) DEFAULT 'amelia_import',
  amelia_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clients_business_id ON clients(business_id);
CREATE INDEX idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX idx_clients_phone ON clients(phone) WHERE phone IS NOT NULL;

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON clients FOR ALL USING (true);
      `);
    } else {
      console.log('✓ Table might already exist');
    }
  } else {
    console.log('✓ Table created successfully');
  }
}

createClientsTable();
