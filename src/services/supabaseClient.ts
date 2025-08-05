import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log the values to help with debugging
console.log('Attempting to connect to Supabase with URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey || typeof supabaseUrl !== 'string' || supabaseUrl.includes('PASTE_YOUR')) {
  const errorMessage = `
    Supabase configuration error:
    - VITE_SUPABASE_URL is missing, invalid, or still a placeholder.
    - Please check your .env file and ensure it contains the correct Supabase Project URL and Anon Key.
    - Current URL value being used: "${supabaseUrl}"
  `;
  console.error(errorMessage);
  throw new Error('Supabase URL and/or Anon Key are invalid. Check the developer console for details.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Successfully created Supabase client.');