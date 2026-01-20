
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.45.0';

const supabaseUrl = 'https://itgqzqcjjbmckesbupkz.supabase.co';
const supabaseKey = 'sb_publishable_Gs1Oys0Q3YVDQGPsGAvxpw_uOqvLQ08';

export const supabase = createClient(supabaseUrl, supabaseKey);
