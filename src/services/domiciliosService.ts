import { supabase } from '../config/supabase';

export interface Domicilio {
  id: number;
  pedido_id: number;
  repartidor_id: number | null;
  direccion_entrega: string | null;
  estado_entrega: string;
  hora_salida: string | null;
  hora_entrega: string | null;
}

const CAMPOS = 'id, pedido_id, repartidor_id, direccion_entrega, estado_entrega, hora_salida, hora_entrega';

// Domicilios de una lista de pedidos (para el admin)
export const obtenerDomiciliosDePedidos = async (pedidoIds: number[]) => {
  if (pedidoIds.length === 0) return [] as Domicilio[];
  const { data, error } = await supabase.from('domicilios').select(CAMPOS).in('pedido_id', pedidoIds);
  if (error) throw error;
  return (data ?? []) as Domicilio[];
};

export const asignarRepartidor = async (domicilioId: number, repartidorId: number) => {
  const { error } = await supabase
    .from('domicilios')
    .update({ repartidor_id: repartidorId })
    .eq('id', domicilioId);
  if (error) throw error;
};

// ===== Repartidor =====

export interface DomicilioRepartidor extends Domicilio {
  pedido: { id: number; estado: string; total: number } | null;
  cliente: { nombre: string; telefono: string | null } | null;
}

// RLS ya filtra: el repartidor solo ve los domicilios que tiene asignados
export const obtenerMisDomicilios = async () => {
  const { data: domicilios, error } = await supabase
    .from('domicilios')
    .select(CAMPOS)
    .order('id', { ascending: false });
  if (error) throw error;
  if (!domicilios || domicilios.length === 0) return [] as DomicilioRepartidor[];

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('id, estado, total, cliente_id')
    .in('id', domicilios.map((d) => d.pedido_id));

  const clienteIds = [...new Set((pedidos ?? []).map((p) => p.cliente_id).filter(Boolean))];
  const { data: clientes } = clienteIds.length
    ? await supabase.from('clientes').select('id, nombre, telefono').in('id', clienteIds)
    : { data: [] as { id: number; nombre: string; telefono: string | null }[] };

  return domicilios.map((d) => {
    const pedido = (pedidos ?? []).find((p) => p.id === d.pedido_id) ?? null;
    const cliente = (clientes ?? []).find((c) => c.id === pedido?.cliente_id) ?? null;
    return {
      ...d,
      pedido: pedido ? { id: pedido.id, estado: pedido.estado, total: pedido.total } : null,
      cliente: cliente ? { nombre: cliente.nombre, telefono: cliente.telefono } : null,
    };
  }) as DomicilioRepartidor[];
};

// Sale a entregar: domicilio y pedido pasan a 'en_camino'
export const marcarEnCamino = async (domicilio: Domicilio) => {
  const { error } = await supabase
    .from('domicilios')
    .update({ estado_entrega: 'en_camino', hora_salida: new Date().toISOString() })
    .eq('id', domicilio.id);
  if (error) throw error;
  const { error: errorPedido } = await supabase
    .from('pedidos')
    .update({ estado: 'en_camino' })
    .eq('id', domicilio.pedido_id);
  if (errorPedido) throw errorPedido;
};

// Entregado: domicilio y pedido pasan a 'entregado'
export const marcarEntregado = async (domicilio: Domicilio) => {
  const { error } = await supabase
    .from('domicilios')
    .update({ estado_entrega: 'entregado', hora_entrega: new Date().toISOString() })
    .eq('id', domicilio.id);
  if (error) throw error;
  const { error: errorPedido } = await supabase
    .from('pedidos')
    .update({ estado: 'entregado' })
    .eq('id', domicilio.pedido_id);
  if (errorPedido) throw errorPedido;
};
