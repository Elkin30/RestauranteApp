// Estados de pedidos y domicilios (deben coincidir con los CHECK de la base de datos)

export const COLOR_ESTADO: Record<string, string> = {
  pendiente: '#F9A825',
  en_preparacion: '#1E88E5',
  listo: '#43A047',
  en_camino: '#8E24AA',
  entregado: '#2E7D32',
  cancelado: '#C62828',
  libre: '#43A047',
  ocupada: '#C62828',
  reservada: '#F9A825',
};

export const textoEstado = (estado: string) => estado.replace('_', ' ');

// Siguiente paso del pedido según quién lo atiende.
//  - mesa:      pendiente → en_preparacion → listo → entregado
//  - domicilio: pendiente → en_preparacion → listo (el repartidor sigue con en_camino → entregado)
export function siguienteEstado(estado: string, tipo: string): string | null {
  if (estado === 'pendiente') return 'en_preparacion';
  if (estado === 'en_preparacion') return 'listo';
  if (estado === 'listo' && tipo === 'mesa') return 'entregado';
  return null;
}
