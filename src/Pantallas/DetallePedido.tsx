import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { colores } from '../config/tema';
import { LineaPedido, obtenerDetallePedido } from '../services/pedidosService';
import EncabezadoPantalla from '../Componentes/EncabezadoPantalla';

// Productos de un pedido. La usan todos los roles; RLS decide si pueden verlo.
export default function DetallePedido({ navigation, route }: any) {
  const { pedidoId } = route.params as { pedidoId: number };
  const [lineas, setLineas] = useState<LineaPedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerDetallePedido(pedidoId)
      .then(setLineas)
      .catch(() => setError('No se pudo cargar el detalle del pedido.'))
      .finally(() => setCargando(false));
  }, [pedidoId]);

  const total = lineas.reduce((s, l) => s + l.precio_unitario * l.cantidad, 0);

  return (
    <View style={styles.contenedor}>
      <EncabezadoPantalla titulo={`Pedido #${pedidoId}`} onVolver={() => navigation.goBack()} />
      {cargando && <ActivityIndicator size="large" color={colores.primario} />}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={lineas}
        keyExtractor={(l) => String(l.producto_id)}
        ListEmptyComponent={!cargando && !error ? <Text style={styles.vacio}>Este pedido no tiene productos.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.fila}>
            <Text style={styles.cantidad}>{item.cantidad}×</Text>
            <Text style={styles.nombre}>{item.nombre}</Text>
            <Text style={styles.subtotal}>${item.precio_unitario * item.cantidad}</Text>
          </View>
        )}
        ListFooterComponent={
          lineas.length > 0 ? <Text style={styles.total}>Total: ${total}</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, paddingTop: 56, backgroundColor: colores.fondo },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.blanco,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  cantidad: { fontWeight: '800', color: colores.primario, width: 36 },
  nombre: { flex: 1, fontSize: 15, color: colores.texto },
  subtotal: { fontWeight: '700', color: colores.texto },
  total: { fontSize: 20, fontWeight: '800', color: colores.texto, marginTop: 12, textAlign: 'right' },
  vacio: { textAlign: 'center', color: colores.gris, marginTop: 24 },
  error: { color: '#C62828', marginBottom: 12, textAlign: 'center' },
});
