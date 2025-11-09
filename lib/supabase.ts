import { createClient } from "@supabase/supabase-js";

/* 

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mpgrsfplveauotgipkhh.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

*/

const supabaseUrl = "https://mpgrsfplveauotgipkhh.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);
