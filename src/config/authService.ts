import { supabase } from './supabase';

export type Rol = 'cliente' | 'mesero' | 'repartidor' | 'admin' | 'desconocido';

export async function obtenerRol(): Promise<{ rol: Rol; nombre: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { rol: 'desconocido', nombre: '' };

  const { data: empleado } = await supabase
    .from('empleados')
    .select('nombre, rol')
    .eq('auth_id', user.id)
    .maybeSingle();
  if (empleado) return { rol: empleado.rol as Rol, nombre: empleado.nombre };

  const { data: cliente } = await supabase
    .from('clientes')
    .select('nombre')
    .eq('auth_id', user.id)
    .maybeSingle();
  if (cliente) return { rol: 'cliente', nombre: cliente.nombre };

  return { rol: 'desconocido', nombre: '' };
}