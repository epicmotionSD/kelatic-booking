import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function reset() {
  const { data, error } = await supabase.auth.admin.updateUserById(
    '6a60f95b-ae44-462d-8451-e084966d71cf', // shawnsonnier04@gmail.com
    { password: 'Admin123!' }
  );
  
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('✅ Password reset successfully!');
    console.log('Email: shawnsonnier04@gmail.com');
    console.log('New password: Admin123!');
  }
}

reset();
