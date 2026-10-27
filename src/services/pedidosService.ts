import { supabase } from '../config/supabase';

export interface Pedido {
  id?: number;
  cliente_id?: number;
  tipo_pedido: string;
  estado: string;
  total: number;
  created_at?: string;
}

// 1. OBTENER PEDIDOS (LEER)
export const obtenerMisPedidos = async () => {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// 2. CREAR UN NUEVO PEDIDO
export const crearPedido = async (nuevoPedido: Partial<Pedido>) => {
  const { data, error } = await supabase
    .from('pedidos')
    .insert([nuevoPedido])
    .select();

  if (error) throw error;
  return data[0];
};

// 3. CANCELAR / ELIMINAR PEDIDO
export const cancelarPedido = async (pedidoId: number) => {
  const { error } = await supabase
    .from('pedidos')
    .update({ estado: 'cancelado' })
    .eq('id', pedidoId);

  if (error) throw error;
  return true;
};