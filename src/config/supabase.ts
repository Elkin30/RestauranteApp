import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL de tu proyecto en Supabase
const SUPABASE_URL = 'https://meoqenbijstfpejqdotx.supabase.co';

// Clave pública (publishable key) de tu proyecto
const SUPABASE_ANON_KEY = 'sb_publishable_BtcgYo8c9NI9xl8foxrXqg_g_jm-y3D';

// Cliente con persistencia de sesión automática
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});