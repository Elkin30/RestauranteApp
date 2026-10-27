import { createClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

export type RolEmpleado = 'admin' | 'mesero' | 'repartidor';

export interface Empleado {
  id: number;
  nombre: string;
  rol: RolEmpleado;
  telefono: string | null;
  auth_id: string | null;
}

export const obtenerEmpleados = async () => {
  const { data, error } = await supabase
    .from('empleados')
    .select('id, nombre, rol, telefono, auth_id')
    .order('rol')
    .order('nombre');
  if (error) throw error;
  return (data ?? []) as Empleado[];
};

export const obtenerRepartidores = async () => {
  const { data, error } = await supabase
    .from('empleados')
    .select('id, nombre, rol, telefono, auth_id')
    .eq('rol', 'repartidor')
    .order('nombre');
  if (error) throw error;
  return (data ?? []) as Empleado[];
};

// Crea la cuenta de acceso del empleado y su fila en "empleados".
// Se usa un cliente aparte SIN guardar sesión: así el admin no pierde la suya
// al registrar a otra persona.
export const crearEmpleado = async (datos: {
  nombre: string;
  telefono: string;
  rol: RolEmpleado;
  email: string;
  password: string;
}) => {
  const clienteTemporal = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );

  // tipo = 'empleado' evita que el trigger lo cree también como cliente
  const { data, error } = await clienteTemporal.auth.signUp({
    email: datos.email.trim(),
    password: datos.password,
    options: { data: { nombre: datos.nombre.trim(), tipo: 'empleado' } },
  });
  if (error) throw error;
  // Si el correo ya existe, Supabase devuelve un usuario sin identidades
  if (!data.user || data.user.identities?.length === 0) {
    throw new Error('Ya existe una cuenta con ese correo.');
  }

  const { error: errorEmpleado } = await supabase.from('empleados').insert({
    nombre: datos.nombre.trim(),
    telefono: datos.telefono.trim() || null,
    rol: datos.rol,
    auth_id: data.user.id,
  });
  if (errorEmpleado) throw errorEmpleado;
};

export const cambiarRolEmpleado = async (id: number, rol: RolEmpleado) => {
  const { error } = await supabase.from('empleados').update({ rol }).eq('id', id);
  if (error) throw error;
};

export const eliminarEmpleado = async (id: number) => {
  const { error } = await supabase.from('empleados').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') throw new Error('El empleado tiene pedidos o domicilios registrados.');
    throw error;
  }
};
