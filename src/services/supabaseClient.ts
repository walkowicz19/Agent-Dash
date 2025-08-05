import { createClient } from '@supabase/supabase-js';

// --- Hardcoded Supabase Configuration ---
// NOTE: For development purposes, we are hardcoding the credentials here
// to resolve the connection issue. In a production environment, it is
// highly recommended to use environment variables (.env file) instead.
const supabaseUrl = 'https://psekkivddkuxtlzzfxih.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZWtraXZkZGt1eHRsenpmeGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MDE3NzIsImV4cCI6MjA2OTk3Nzc3Mn0.Oobsdm9fyIxALbB_BLruxqWwYxDVCKM2rM1F04tJ470';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and/or Anon Key are missing in the code.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Successfully created Supabase client.');