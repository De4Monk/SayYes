import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("CRITICAL: Supabase config missing!", {
        url: supabaseUrl ? 'Set' : 'Missing',
        key: supabaseKey ? 'Set' : 'Missing'
    });
    throw new Error("supabaseUrl and supabaseKey are required. Check your .env file or build arguments.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
