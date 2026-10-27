import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colores } from '../config/tema';
import { Mesa, obtenerMesas, crearMesa, eliminarMesa } from '../services/mesasService';
import EncabezadoPantalla from '../Componentes/EncabezadoPantalla';
import EtiquetaEstado from '../Componentes/EtiquetaEstado';
import CampoTexto from '../Componentes/CampoTexto';
import Boton from '../Componentes/Boton';

export default function AdminMesas({ navigation }: any) {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [numero, setNumero] = useState('');
  const [capacidad, setCapacidad] = useState('4');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setMesas(await obtenerMesas());
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las mesas.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const agregar = async () => {
    const n = Number(numero);
    const c = Number(capacidad);
    if (!n || n <= 0) return Alert.alert('Número inválido', 'Escribe el número de la mesa.');
    if (!c || c <= 0) return Alert.alert('Capacidad inválida', 'La capacidad debe ser mayor a 0.');
    setGuardando(true);
    try {
      await crearMesa(n, c);
      setNumero('');
      cargar();
    } catch (e: any) {
      Alert.alert('No se pudo crear', e?.message ?? 'Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = (m: Mesa) => {
    Alert.alert('Eliminar mesa', `¿Eliminar la mesa ${m.numero_mesa}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarMesa(m.id);
            cargar();
          } catch (e: any) {
            Alert.alert('No se pudo eliminar', e?.message ?? 'Inténtalo de nuevo.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.contenedor}>
      <EncabezadoPantalla titulo="Mesas" onVolver={() => navigation.goBack()} />

      <View style={styles.formulario}>
        <View style={{ flex: 1 }}>
          <CampoTexto
            placeholder="N° mesa"
            value={numero}
            onChangeText={(v) => setNumero(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <CampoTexto
            placeholder="Capacidad"
            value={capacidad}
            onChangeText={(v) => setCapacidad(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />
        </View>
      </View>
      <Boton titulo="+ Agregar mesa" onPress={agregar} cargando={guardando} />
      <View style={{ height: 12 }} />

      <FlatList
        data={mesas}
        keyExtractor={(m) => String(m.id)}
        refreshing={cargando}
        onRefresh={cargar}
        ListEmptyComponent={!cargando ? <Text style={styles.vacio}>No hay mesas.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>Mesa {item.numero_mesa}</Text>
              <Text style={styles.detalle}>{item.capacidad} personas</Text>
            </View>
            <EtiquetaEstado estado={item.estado} />
            <TouchableOpacity onPress={() => confirmarEliminar(item)} style={{ marginLeft: 12 }}>
              <Text style={styles.eliminar}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, paddingTop: 56, backgroundColor: colores.fondo },
  formulario: { flexDirection: 'row', gap: 8 },
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
  detalle: { color: colores.gris, fontSize: 12, marginTop: 2 },
  eliminar: { color: '#C62828', fontWeight: '700' },
  vacio: { textAlign: 'center', color: colores.gris, marginTop: 24 },
});
