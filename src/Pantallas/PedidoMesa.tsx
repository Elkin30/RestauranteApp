import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colores } from '../config/tema';
import { ItemCarrito } from '../config/CarritoContext';
import { Producto, obtenerProductos } from '../services/productosService';
import { crearPedidoMesa } from '../services/pedidosService';
import EncabezadoPantalla from '../Componentes/EncabezadoPantalla';
import Boton from '../Componentes/Boton';

// El mesero arma el pedido de una mesa. Las cantidades se guardan solo en esta pantalla.
export default function PedidoMesa({ navigation, route }: any) {
  const { mesaId, numeroMesa } = route.params as { mesaId: number; numeroMesa: number };
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerProductos()
      .then((lista) => setProductos(lista.filter((p) => p.disponible)))
      .catch(() => Alert.alert('Error', 'No se pudo cargar el menú.'));
  }, []);

  const cambiar = (id: number, delta: number) =>
    setCantidades((actual) => ({ ...actual, [id]: Math.max(0, (actual[id] ?? 0) + delta) }));

  const items: ItemCarrito[] = productos
    .filter((p) => (cantidades[p.id] ?? 0) > 0)
    .map((p) => ({ producto: { id: p.id, nombre: p.nombre, precio: p.precio }, cantidad: cantidades[p.id] }));
  const total = items.reduce((s, i) => s + i.producto.precio * i.cantidad, 0);

  const enviar = async () => {
    if (items.length === 0) return Alert.alert('Pedido vacío', 'Agrega al menos un producto.');
    setEnviando(true);
    try {
      const id = await crearPedidoMesa(mesaId, items);
      Alert.alert('Pedido enviado', `Pedido #${id} para la mesa ${numeroMesa}.`);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('No se pudo enviar', e?.message ?? 'Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.contenedor}>
      <EncabezadoPantalla titulo={`Pedido · Mesa ${numeroMesa}`} onVolver={() => navigation.goBack()} />
      <FlatList
        data={productos}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => {
          const cantidad = cantidades[item.id] ?? 0;
          return (
            <View style={[styles.tarjeta, cantidad > 0 && { borderColor: colores.primario }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nombre}>{item.nombre}</Text>
                <Text style={styles.precio}>${item.precio}</Text>
              </View>
              <View style={styles.contador}>
                <TouchableOpacity style={styles.botonCantidad} onPress={() => cambiar(item.id, -1)}>
                  <Text style={styles.textoCantidad}>−</Text>
                </TouchableOpacity>
                <Text style={styles.cantidad}>{cantidad}</Text>
                <TouchableOpacity style={styles.botonCantidad} onPress={() => cambiar(item.id, 1)}>
                  <Text style={styles.textoCantidad}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
      <Text style={styles.total}>Total: ${total}</Text>
      <Boton titulo="Enviar a cocina" onPress={enviar} cargando={enviando} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, paddingTop: 56, backgroundColor: colores.fondo },
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
  precio: { color: colores.primario, fontWeight: '700', marginTop: 2 },
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
});
