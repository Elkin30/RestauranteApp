import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colores } from '../config/tema';
import {
  DomicilioRepartidor,
  obtenerMisDomicilios,
  marcarEnCamino,
  marcarEntregado,
} from '../services/domiciliosService';
import EncabezadoPantalla from '../Componentes/EncabezadoPantalla';
import EtiquetaEstado from '../Componentes/EtiquetaEstado';
import Opciones from '../Componentes/Opciones';

type Filtro = 'pendientes' | 'entregados';

export default function PanelRepartidor({ navigation }: any) {
  const [domicilios, setDomicilios] = useState<DomicilioRepartidor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('pendientes');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setDomicilios(await obtenerMisDomicilios());
    } catch {
      Alert.alert('Error', 'No se pudieron cargar tus domicilios.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const ejecutar = async (accion: () => Promise<void>) => {
    try {
      await accion();
      cargar();
    } catch (e: any) {
      Alert.alert('No se pudo actualizar', e?.message ?? 'Inténtalo de nuevo.');
    }
  };

  const terminados = ['entregado', 'cancelado'];
  const lista = domicilios.filter((d) =>
    filtro === 'entregados' ? terminados.includes(d.estado_entrega) : !terminados.includes(d.estado_entrega)
  );

  return (
    <View style={styles.contenedor}>
      <EncabezadoPantalla titulo="Mis domicilios" onVolver={() => navigation.goBack()} />
      <Opciones
        opciones={[
          { valor: 'pendientes', etiqueta: 'Por entregar' },
          { valor: 'entregados', etiqueta: 'Historial' },
        ]}
        seleccionada={filtro}
        onCambiar={setFiltro}
      />
      <FlatList
        data={lista}
        keyExtractor={(d) => String(d.id)}
        refreshing={cargando}
        onRefresh={cargar}
        ListEmptyComponent={
          !cargando ? <Text style={styles.vacio}>No tienes domicilios {filtro === 'pendientes' ? 'asignados' : 'entregados'}.</Text> : null
        }
        renderItem={({ item }) => {
          const pedidoListo = item.pedido?.estado === 'listo';
          return (
            <View style={styles.tarjeta}>
              <View style={styles.fila}>
                <Text style={styles.nombre}>Pedido #{item.pedido_id}</Text>
                <EtiquetaEstado estado={item.estado_entrega} />
              </View>
              {item.pedido && <Text style={styles.total}>Cobrar: ${item.pedido.total}</Text>}
              <Text style={styles.detalle}>📍 {item.direccion_entrega ?? 'Sin dirección'}</Text>
              {item.cliente && (
                <Text style={styles.detalle}>
                  👤 {item.cliente.nombre}
                  {item.cliente.telefono ? ` · ${item.cliente.telefono}` : ''}
                </Text>
              )}

              <View style={styles.acciones}>
                <TouchableOpacity onPress={() => navigation.navigate('DetallePedido', { pedidoId: item.pedido_id })}>
                  <Text style={styles.enlace}>Ver productos</Text>
                </TouchableOpacity>
                {item.cliente?.telefono && (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.cliente!.telefono}`)}>
                    <Text style={styles.enlace}>Llamar</Text>
                  </TouchableOpacity>
                )}
              </View>

              {item.estado_entrega === 'pendiente' && (
                pedidoListo ? (
                  <TouchableOpacity style={styles.boton} onPress={() => ejecutar(() => marcarEnCamino(item))}>
                    <Text style={styles.textoBoton}>🛵 Salí a entregar</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.espera}>
                    Esperando que la cocina lo marque como listo ({item.pedido?.estado.replace('_', ' ') ?? '...'})
                  </Text>
                )
              )}
              {item.estado_entrega === 'en_camino' && (
                <TouchableOpacity style={styles.boton} onPress={() => ejecutar(() => marcarEntregado(item))}>
                  <Text style={styles.textoBoton}>✅ Entregado</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, paddingTop: 56, backgroundColor: colores.fondo },
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
  detalle: { color: colores.texto, fontSize: 14, marginTop: 4 },
  acciones: { flexDirection: 'row', gap: 16, marginTop: 8 },
  enlace: { color: colores.primario, fontWeight: '700' },
  boton: {
    backgroundColor: colores.primario,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  textoBoton: { color: colores.blanco, fontWeight: '700', fontSize: 15 },
  espera: { color: colores.gris, fontStyle: 'italic', marginTop: 12 },
  vacio: { textAlign: 'center', color: colores.gris, marginTop: 24 },
});
