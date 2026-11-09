import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { avisar, confirmar } from '../config/dialogos';
import { colores } from '../config/tema';
import { Errores, sinErrores, validarNumeroPositivo } from '../config/validaciones';
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
  const [errores, setErrores] = useState<Errores<{ numero: string; capacidad: string }>>({});
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setMesas(await obtenerMesas());
    } catch {
      avisar('Error', 'No se pudieron cargar las mesas.');
    } finally {
      setCargando(false);
    }
  }, []);

  // Carga al entrar a la pantalla y cada vez que se vuelve a ella
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const agregar = async () => {
    const nuevos = {
      numero: validarNumeroPositivo(numero, 'El número de mesa'),
      capacidad: validarNumeroPositivo(capacidad, 'La capacidad'),
    };
    setErrores(nuevos);
    if (!sinErrores(nuevos)) return;
    setGuardando(true);
    try {
      await crearMesa(Number(numero), Number(capacidad));
      setNumero('');
      cargar();
    } catch (e: any) {
      avisar('No se pudo crear', e?.message ?? 'Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async (m: Mesa) => {
    if (!(await confirmar('Eliminar mesa', `¿Eliminar la mesa ${m.numero_mesa}?`, 'Eliminar'))) return;
    try {
      await eliminarMesa(m.id);
      cargar();
    } catch (e: any) {
      avisar('No se pudo eliminar', e?.message ?? 'Inténtalo de nuevo.');
    }
  };

  return (
    <View style={styles.contenedor}>
      <EncabezadoPantalla titulo="Mesas" onVolver={() => navigation.goBack()} />

      <View style={styles.formulario}>
        <View style={{ flex: 1 }}>
          <CampoTexto
            etiqueta="N° de mesa"
            obligatorio
            placeholder="Ej: 5"
            value={numero}
            onChangeText={(v) => {
              setNumero(v.replace(/[^0-9]/g, ''));
              setErrores((e) => ({ ...e, numero: undefined }));
            }}
            error={errores.numero}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <CampoTexto
            etiqueta="Capacidad"
            obligatorio
            placeholder="Ej: 4"
            value={capacidad}
            onChangeText={(v) => {
              setCapacidad(v.replace(/[^0-9]/g, ''));
              setErrores((e) => ({ ...e, capacidad: undefined }));
            }}
            error={errores.capacidad}
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
