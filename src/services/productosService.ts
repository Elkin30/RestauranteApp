import { supabase } from '../config/supabase';

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string | null;
  disponible: boolean;
}

export type ProductoNuevo = Omit<Producto, 'id'>;

// El admin ve todos (también los no disponibles); los demás solo los disponibles (RLS)
export const obtenerProductos = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, descripcion, precio, categoria, disponible')
    .order('categoria')
    .order('nombre');
  if (error) throw error;
  return (data ?? []) as Producto[];
};

export const crearProducto = async (producto: ProductoNuevo) => {
  const { error } = await supabase.from('productos').insert(producto);
  if (error) throw error;
};

export const actualizarProducto = async (id: number, cambios: Partial<ProductoNuevo>) => {
  const { error } = await supabase.from('productos').update(cambios).eq('id', id);
  if (error) throw error;
};

export const eliminarProducto = async (id: number) => {
  const { error } = await supabase.from('productos').delete().eq('id', id);
  if (error) {
    // 23503 = el producto aparece en pedidos anteriores
    if (error.code === '23503') {
      throw new Error('Este producto ya está en pedidos. Márcalo como no disponible en vez de eliminarlo.');
    }
    throw error;
  }
};
