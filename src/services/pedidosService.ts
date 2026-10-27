import { supabase } from '../config/supabase';
import { ItemCarrito } from '../config/CarritoContext';

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

// 2b. CREAR PEDIDO A DOMICILIO DESDE EL CARRITO
//     Crea el pedido, sus detalles y el domicilio. Si algo falla después de
//     crear el pedido, lo deja cancelado para que no quede a medias.
export const crearPedidoDomicilio = async (items: ItemCarrito[], direccion: string) => {
  if (items.length === 0) throw new Error('El carrito está vacío.');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión.');

  const { data: cliente, error: errorCliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle();
  if (errorCliente) throw errorCliente;
  if (!cliente) throw new Error('Solo los clientes pueden hacer pedidos a domicilio.');

  const total = items.reduce((suma, i) => suma + i.producto.precio * i.cantidad, 0);

  const { data: pedido, error: errorPedido } = await supabase
    .from('pedidos')
    .insert({ cliente_id: cliente.id, tipo_pedido: 'domicilio', estado: 'pendiente', total })
    .select('id')
    .single();
  if (errorPedido) throw errorPedido;

  try {
    const detalles = items.map((i) => ({
      pedido_id: pedido.id,
      producto_id: i.producto.id,
      cantidad: i.cantidad,
      precio_unitario: i.producto.precio,
    }));
    const { error: errorDetalles } = await supabase.from('detalles_pedido').insert(detalles);
    if (errorDetalles) throw errorDetalles;

    const { error: errorDomicilio } = await supabase
      .from('domicilios')
      .insert({ pedido_id: pedido.id, direccion_entrega: direccion.trim() });
    if (errorDomicilio) throw errorDomicilio;
  } catch (e) {
    await supabase.from('pedidos').update({ estado: 'cancelado' }).eq('id', pedido.id);
    throw e;
  }

  return pedido.id as number;
};

// 3. CANCELAR PEDIDO (solo se puede mientras esté 'pendiente')
export const cancelarPedido = async (pedidoId: number) => {
  const { data, error } = await supabase
    .from('pedidos')
    .update({ estado: 'cancelado' })
    .eq('id', pedidoId)
    .eq('estado', 'pendiente')
    .select('id');

  if (error) throw error;
  // Si RLS o el estado impiden el cambio, Supabase no da error: devuelve 0 filas
  if (!data || data.length === 0) {
    throw new Error('El pedido ya no se puede cancelar.');
  }
  return true;
};
// ===================== Personal del restaurante =====================

export interface PedidoCompleto {
  id: number;
  cliente_id: number | null;
  mesa_id: number | null;
  empleado_id: number | null;
  tipo_pedido: 'mesa' | 'domicilio';
  estado: string;
  total: number;
  created_at: string;
}

// 4. LISTAR PEDIDOS (RLS decide cuáles ve cada rol: admin todos, mesero los de mesa)
export const obtenerPedidos = async (filtro?: { tipo?: 'mesa' | 'domicilio'; soloActivos?: boolean }) => {
  let consulta = supabase
    .from('pedidos')
    .select('id, cliente_id, mesa_id, empleado_id, tipo_pedido, estado, total, created_at')
    .order('created_at', { ascending: false });
  if (filtro?.tipo) consulta = consulta.eq('tipo_pedido', filtro.tipo);
  if (filtro?.soloActivos) consulta = consulta.not('estado', 'in', '(entregado,cancelado)');

  const { data, error } = await consulta;
  if (error) throw error;
  return (data ?? []) as PedidoCompleto[];
};

// 5. CAMBIAR ESTADO DE UN PEDIDO
export const cambiarEstadoPedido = async (pedidoId: number, estado: string) => {
  const { data, error } = await supabase
    .from('pedidos')
    .update({ estado })
    .eq('id', pedidoId)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No tienes permiso para cambiar este pedido.');
};

// 6. CREAR PEDIDO EN MESA (mesero)
export const crearPedidoMesa = async (mesaId: number, items: ItemCarrito[]) => {
  if (items.length === 0) throw new Error('Agrega al menos un producto.');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión.');

  const { data: empleado, error: errorEmpleado } = await supabase
    .from('empleados')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle();
  if (errorEmpleado) throw errorEmpleado;
  if (!empleado) throw new Error('Solo el personal puede tomar pedidos en mesa.');

  const total = items.reduce((suma, i) => suma + i.producto.precio * i.cantidad, 0);

  const { data: pedido, error: errorPedido } = await supabase
    .from('pedidos')
    .insert({ mesa_id: mesaId, empleado_id: empleado.id, tipo_pedido: 'mesa', estado: 'pendiente', total })
    .select('id')
    .single();
  if (errorPedido) throw errorPedido;

  try {
    const detalles = items.map((i) => ({
      pedido_id: pedido.id,
      producto_id: i.producto.id,
      cantidad: i.cantidad,
      precio_unitario: i.producto.precio,
    }));
    const { error: errorDetalles } = await supabase.from('detalles_pedido').insert(detalles);
    if (errorDetalles) throw errorDetalles;

    const { error: errorMesa } = await supabase.from('mesas').update({ estado: 'ocupada' }).eq('id', mesaId);
    if (errorMesa) throw errorMesa;
  } catch (e) {
    await supabase.from('pedidos').update({ estado: 'cancelado' }).eq('id', pedido.id);
    throw e;
  }

  return pedido.id as number;
};

// 7. DETALLE DE UN PEDIDO (productos y cantidades)
export interface LineaPedido {
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

export const obtenerDetallePedido = async (pedidoId: number) => {
  const { data: detalles, error } = await supabase
    .from('detalles_pedido')
    .select('producto_id, cantidad, precio_unitario')
    .eq('pedido_id', pedidoId);
  if (error) throw error;
  if (!detalles || detalles.length === 0) return [] as LineaPedido[];

  const ids = [...new Set(detalles.map((d) => d.producto_id))];
  const { data: productos } = await supabase.from('productos').select('id, nombre').in('id', ids);
  const nombres = new Map((productos ?? []).map((p) => [p.id, p.nombre as string]));

  return detalles.map((d) => ({
    ...d,
    nombre: nombres.get(d.producto_id) ?? `Producto #${d.producto_id}`,
  })) as LineaPedido[];
};
