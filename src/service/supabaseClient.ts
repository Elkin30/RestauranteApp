import { createClient } from '@supabase/supabase-js';

// URL de tu proyecto en Supabase
const SUPABASE_URL = 'https://meoqenbijstfpejqdotx.supabase.co';

// Pega aquí la clave pública 'anon' de tu proyecto
const SUPABASE_ANON_KEY = 'zbZlRgFw3h23M3wk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);