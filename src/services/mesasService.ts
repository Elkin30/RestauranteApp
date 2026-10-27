import { supabase } from '../config/supabase';

export type EstadoMesa = 'libre' | 'ocupada' | 'reservada';

export interface Mesa {
  id: number;
  numero_mesa: number;
  capacidad: number;
  estado: EstadoMesa;
}

export const obtenerMesas = async () => {
  const { data, error } = await supabase
    .from('mesas')
    .select('id, numero_mesa, capacidad, estado')
    .order('numero_mesa');
  if (error) throw error;
  return (data ?? []) as Mesa[];
};

export const crearMesa = async (numero_mesa: number, capacidad: number) => {
  const { error } = await supabase.from('mesas').insert({ numero_mesa, capacidad, estado: 'libre' });
  if (error) {
    if (error.code === '23505') throw new Error(`Ya existe la mesa ${numero_mesa}.`);
    throw error;
  }
};

export const cambiarEstadoMesa = async (id: number, estado: EstadoMesa) => {
  const { error } = await supabase.from('mesas').update({ estado }).eq('id', id);
  if (error) throw error;
};

export const eliminarMesa = async (id: number) => {
  const { error } = await supabase.from('mesas').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') throw new Error('La mesa tiene pedidos registrados y no se puede eliminar.');
    throw error;
  }
};
