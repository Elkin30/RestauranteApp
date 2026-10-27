import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colores } from '../config/tema';
import { COLOR_ESTADO, siguienteEstado, textoEstado } from '../config/estados';
import { Mesa, obtenerMesas, cambiarEstadoMesa } from '../services/mesasService';
import { PedidoCompleto, obtenerPedidos, cambiarEstadoPedido } from '../services/pedidosService';
import EncabezadoPantalla from '../Componentes/EncabezadoPantalla';
import EtiquetaEstado from '../Componentes/EtiquetaEstado';

export default function PanelMesero({ navigation }: any) {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [pedidos, setPedidos] = useState<PedidoCompleto[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [m, p] = await Promise.all([obtenerMesas(), obtenerPedidos({ tipo: 'mesa', soloActivos: true })]);
      setMesas(m);
      setPedidos(p);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las mesas.');
    } finally {
      setCargando(false);
    }
  }, []);

  // Recarga cada vez que se vuelve a esta pantalla (por ejemplo, después de tomar un pedido)
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const tocarMesa = (mesa: Mesa) => {
    const tomarPedido = () => navigation.navigate('PedidoMesa', { mesaId: mesa.id, numeroMesa: mesa.numero_mesa });
    if (mesa.estado === 'libre') return tomarPedido();

    Alert.alert(`Mesa ${mesa.numero_mesa}`, `Estado: ${mesa.estado}`, [
      { text: 'Nuevo pedido', onPress: tomarPedido },
      {
        text: 'Liberar mesa',
        onPress: async () => {
          const pendientes = pedidos.filter((p) => p.mesa_id === mesa.id);
          if (pendientes.length > 0) {
            return Alert.alert('Mesa con pedidos', 'Entrega o cancela sus pedidos antes de liberarla.');
          }
          try {
            await cambiarEstadoMesa(mesa.id, 'libre');
            cargar();
          } catch {
            Alert.alert('Error', 'No se pudo liberar la mesa.');
          }
        },
      },
      { text: 'Cerrar', style: 'cancel' },
    ]);
  };

  const avanzar = async (p: PedidoCompleto, nuevo: string) => {
    try {
      await cambiarEstadoPedido(p.id, nuevo);
      cargar();
    } catch (e: any) {
      Alert.alert('No se pudo actualizar', e?.message ?? 'Inténtalo de nuevo.');
    }
  };

  const numeroDeMesa = (id: number | null) => mesas.find((m) => m.id === id)?.numero_mesa ?? '?';

  return (
    <View style={styles.contenedor}>
      <FlatList
        data={pedidos}
        keyExtractor={(p) => String(p.id)}
        refreshing={cargando}
        onRefresh={cargar}
        ListHeaderComponent={
          <View>
            <EncabezadoPantalla titulo="Mesas" onVolver={() => navigation.goBack()} />
            <Text style={styles.ayuda}>Toca una mesa libre para tomar el pedido.</Text>
            <View style={styles.grilla}>
              {mesas.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.mesa, { borderColor: COLOR_ESTADO[m.estado] ?? colores.borde }]}
                  onPress={() => tocarMesa(m)}
                >
                  <Text style={styles.numeroMesa}>{m.numero_mesa}</Text>
                  <Text style={[styles.estadoMesa, { color: COLOR_ESTADO[m.estado] ?? colores.gris }]}>
                    {m.estado}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.subtitulo}>Pedidos activos</Text>
          </View>
        }
        ListEmptyComponent={!cargando ? <Text style={styles.vacio}>No hay pedidos activos.</Text> : null}
        renderItem={({ item }) => {
          const siguiente = siguienteEstado(item.estado, item.tipo_pedido);
          return (
            <TouchableOpacity
              style={styles.tarjeta}
              onPress={() => navigation.navigate('DetallePedido', { pedidoId: item.id })}
            >
              <View style={styles.fila}>
                <Text style={styles.nombre}>
                  Mesa {numeroDeMesa(item.mesa_id)} · #{item.id}
                </Text>
                <EtiquetaEstado estado={item.estado} />
              </View>
              <Text style={styles.total}>${item.total}</Text>
              {siguiente && (
                <TouchableOpacity style={styles.boton} onPress={() => avanzar(item, siguiente)}>
                  <Text style={styles.textoBoton}>Pasar a {textoEstado(siguiente)}</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, paddingTop: 56, backgroundColor: colores.fondo },
  ayuda: { color: colores.gris, marginBottom: 12 },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  mesa: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: colores.blanco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroMesa: { fontSize: 22, fontWeight: '800', color: colores.texto },
  estadoMesa: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  subtitulo: { fontSize: 18, fontWeight: '800', color: colores.texto, marginBottom: 10 },
  tarjeta: {
    backgroundColor: colores.blanco,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nombre: { fontSize: 16, fontWeight: '700', color: colores.texto },
  total: { fontSize: 15, fontWeight: '800', color: colores.primario, marginTop: 4 },
  boton: {
    alignSelf: 'flex-start',
    backgroundColor: colores.primario,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  textoBoton: { color: colores.blanco, fontWeight: '700', fontSize: 13 },
  vacio: { textAlign: 'center', color: colores.gris, marginTop: 12 },
});
