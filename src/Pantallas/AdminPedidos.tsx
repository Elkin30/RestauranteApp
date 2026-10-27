import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colores } from '../config/tema';
import { siguienteEstado, textoEstado } from '../config/estados';
import { PedidoCompleto, obtenerPedidos, cambiarEstadoPedido } from '../services/pedidosService';
import { Domicilio, obtenerDomiciliosDePedidos, asignarRepartidor } from '../services/domiciliosService';
import { Empleado, obtenerRepartidores } from '../services/empleadosService';
import EncabezadoPantalla from '../Componentes/EncabezadoPantalla';
import EtiquetaEstado from '../Componentes/EtiquetaEstado';
import Opciones from '../Componentes/Opciones';

type Filtro = 'activos' | 'domicilio' | 'mesa' | 'todos';

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: 'activos', etiqueta: 'Activos' },
  { valor: 'domicilio', etiqueta: 'Domicilios' },
  { valor: 'mesa', etiqueta: 'Mesas' },
  { valor: 'todos', etiqueta: 'Todos' },
];

export default function AdminPedidos({ navigation }: any) {
  const [filtro, setFiltro] = useState<Filtro>('activos');
  const [pedidos, setPedidos] = useState<PedidoCompleto[]>([]);
  const [domicilios, setDomicilios] = useState<Domicilio[]>([]);
  const [repartidores, setRepartidores] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  // Domicilio al que se le está eligiendo repartidor
  const [asignandoId, setAsignandoId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const lista = await obtenerPedidos({
        soloActivos: filtro === 'activos',
        tipo: filtro === 'mesa' || filtro === 'domicilio' ? filtro : undefined,
      });
      setPedidos(lista);
      const idsDomicilio = lista.filter((p) => p.tipo_pedido === 'domicilio').map((p) => p.id);
      const [doms, reps] = await Promise.all([obtenerDomiciliosDePedidos(idsDomicilio), obtenerRepartidores()]);
      setDomicilios(doms);
      setRepartidores(reps);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los pedidos.');
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const avanzar = async (p: PedidoCompleto, nuevo: string) => {
    try {
      await cambiarEstadoPedido(p.id, nuevo);
      cargar();
    } catch (e: any) {
      Alert.alert('No se pudo actualizar', e?.message ?? 'Inténtalo de nuevo.');
    }
  };

  const confirmarCancelar = (p: PedidoCompleto) => {
    Alert.alert('Cancelar pedido', `¿Cancelar el pedido #${p.id}?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => avanzar(p, 'cancelado') },
    ]);
  };

  const abrirAsignar = (dom: Domicilio) => {
    if (repartidores.length === 0) {
      return Alert.alert('Sin repartidores', 'Crea un empleado con rol repartidor en "Empleados".');
    }
    setAsignandoId(asignandoId === dom.id ? null : dom.id);
  };

  const asignar = async (dom: Domicilio, repartidorId: number) => {
    try {
      await asignarRepartidor(dom.id, repartidorId);
      setAsignandoId(null);
      cargar();
    } catch (e: any) {
      Alert.alert('No se pudo asignar', e?.message ?? 'Inténtalo de nuevo.');
    }
  };

  return (
    <View style={styles.contenedor}>
      <EncabezadoPantalla titulo="Pedidos" onVolver={() => navigation.goBack()} />
      <Opciones opciones={FILTROS} seleccionada={filtro} onCambiar={setFiltro} />

      <FlatList
        data={pedidos}
        keyExtractor={(p) => String(p.id)}
        refreshing={cargando}
        onRefresh={cargar}
        ListEmptyComponent={!cargando ? <Text style={styles.vacio}>No hay pedidos.</Text> : null}
        renderItem={({ item }) => {
          const dom = domicilios.find((d) => d.pedido_id === item.id);
          const repartidor = repartidores.find((r) => r.id === dom?.repartidor_id);
          const siguiente = siguienteEstado(item.estado, item.tipo_pedido);
          const terminado = item.estado === 'entregado' || item.estado === 'cancelado';
          return (
            <TouchableOpacity
              style={styles.tarjeta}
              onPress={() => navigation.navigate('DetallePedido', { pedidoId: item.id })}
            >
              <View style={styles.fila}>
                <Text style={styles.nombre}>
                  #{item.id} · {item.tipo_pedido === 'mesa' ? '🪑 Mesa' : '🛵 Domicilio'}
                </Text>
                <EtiquetaEstado estado={item.estado} />
              </View>
              <Text style={styles.total}>${item.total}</Text>

              {dom && (
                <View style={{ marginTop: 4 }}>
                  <Text style={styles.detalle}>📍 {dom.direccion_entrega ?? 'Sin dirección'}</Text>
                  <Text style={styles.detalle}>🛵 {repartidor ? repartidor.nombre : 'Sin repartidor asignado'}</Text>
                </View>
              )}

              {!terminado && (
                <View style={styles.acciones}>
                  {siguiente && (
                    <TouchableOpacity style={styles.boton} onPress={() => avanzar(item, siguiente)}>
                      <Text style={styles.textoBoton}>Pasar a {textoEstado(siguiente)}</Text>
                    </TouchableOpacity>
                  )}
                  {dom && !dom.repartidor_id && (
                    <TouchableOpacity style={styles.boton} onPress={() => abrirAsignar(dom)}>
                      <Text style={styles.textoBoton}>{asignandoId === dom.id ? 'Cerrar' : 'Asignar repartidor'}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => confirmarCancelar(item)}>
                    <Text style={styles.cancelar}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {dom && asignandoId === dom.id && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.detalle}>¿Quién lleva el pedido?</Text>
                  <View style={{ height: 6 }} />
                  <Opciones
                    opciones={repartidores.map((r) => ({ valor: r.id, etiqueta: r.nombre }))}
                    seleccionada={dom.repartidor_id}
                    onCambiar={(id) => asignar(dom, id)}
                  />
                </View>
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
  detalle: { color: colores.gris, fontSize: 13, marginTop: 2 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 10 },
  boton: { backgroundColor: colores.primario, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  textoBoton: { color: colores.blanco, fontWeight: '700', fontSize: 13 },
  cancelar: { color: '#C62828', fontWeight: '700' },
  vacio: { textAlign: 'center', color: colores.gris, marginTop: 24 },
});
