import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Les variables d'environnement Supabase ne sont pas définies.");
}
  
// Pour le débogage, vérifiez que les variables ne sont pas undefined
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);



