import { createClient } from '@supabase/supabase-js';

// URL de tu proyecto en Supabase
const SUPABASE_URL = 'https://meoqenbijstfpejqdotx.supabase.co';

// Clave pública (publishable key) de tu proyecto
const SUPABASE_ANON_KEY = 'sb_publishable_BtcgYo8c9NI9xl8foxrXqg_g_jm-y3D';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);