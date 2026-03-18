import { createClient } from '@supabase/supabase-js';
import { join } from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkAgentColumns() {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching agent:', error);
    process.exit(1);
  }

  console.log('Agent record columns:', Object.keys(data[0] ?? {}));
  console.log('Sample data:', data[0]);
}

checkAgentColumns().catch(err => console.error(err));
