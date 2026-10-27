import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useCarrito } from '../config/CarritoContext';
import { crearPedidoDomicilio } from '../services/pedidosService';
import { colores } from '../config/tema';
import Boton from '../Componentes/Boton';
import CampoTexto from '../Componentes/CampoTexto';

export default function Carrito({ navigation }: any) {
  const { items, total, agregar, quitar, vaciar } = useCarrito();
  const [direccion, setDireccion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmarPedido = async () => {
    setError(null);
    if (items.length === 0) {
      setError('Agrega productos al carrito.');
      return;
    }
    if (direccion.trim().length < 5) {
      setError('Escribe la dirección de entrega.');
      return;
    }
    setEnviando(true);
    try {
      const pedidoId = await crearPedidoDomicilio(items, direccion);
      vaciar();
      setDireccion('');
      Alert.alert('¡Pedido enviado!', `Tu pedido #${pedidoId} quedó registrado.`);
      navigation.navigate('MisPedidos');
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo crear el pedido. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.contenedor}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.volver}>← Seguir comprando</Text>
      </TouchableOpacity>
      <Text style={styles.titulo}>Mi carrito</Text>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.producto.id)}
        ListEmptyComponent={<Text style={styles.vacio}>Tu carrito está vacío.</Text>}
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>{item.producto.nombre}</Text>
              <Text style={styles.subtotal}>${item.producto.precio * item.cantidad}</Text>
            </View>
            <View style={styles.contador}>
              <TouchableOpacity style={styles.botonCantidad} onPress={() => quitar(item.producto.id)}>
                <Text style={styles.textoCantidad}>−</Text>
              </TouchableOpacity>
              <Text style={styles.cantidad}>{item.cantidad}</Text>
              <TouchableOpacity style={styles.botonCantidad} onPress={() => agregar(item.producto)}>
                <Text style={styles.textoCantidad}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {items.length > 0 && (
        <View>
          <Text style={styles.total}>Total: ${total}</Text>
          <CampoTexto placeholder="Dirección de entrega" value={direccion} onChangeText={setDireccion} />
          {error && <Text style={styles.error}>{error}</Text>}
          <Boton titulo="Confirmar pedido" onPress={confirmarPedido} cargando={enviando} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, paddingTop: 56, backgroundColor: colores.fondo },
  volver: { color: colores.primario, fontWeight: '600', marginBottom: 8 },
  titulo: { fontSize: 28, fontWeight: '800', color: colores.texto, marginBottom: 12 },
  vacio: { textAlign: 'center', color: colores.gris, marginTop: 24 },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.blanco,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  nombre: { fontSize: 16, fontWeight: '700', color: colores.texto },
  subtotal: { color: colores.primario, fontWeight: '700', marginTop: 2 },
  contador: { flexDirection: 'row', alignItems: 'center' },
  botonCantidad: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCantidad: { color: colores.primario, fontSize: 18, fontWeight: '700' },
  cantidad: { marginHorizontal: 12, fontSize: 16, fontWeight: '700', color: colores.texto },
  total: { fontSize: 20, fontWeight: '800', color: colores.texto, marginVertical: 12, textAlign: 'right' },
  error: { color: '#C62828', marginBottom: 12, textAlign: 'center' },
});
