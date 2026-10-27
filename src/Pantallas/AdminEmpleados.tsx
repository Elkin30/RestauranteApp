import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { colores } from '../config/tema';
import { esEmailValido, mensajeErrorAuth, PASSWORD_MIN } from '../config/validaciones';
import { useAuth } from '../config/AuthContext';
import {
  Empleado,
  RolEmpleado,
  obtenerEmpleados,
  crearEmpleado,
  cambiarRolEmpleado,
  eliminarEmpleado,
} from '../services/empleadosService';
import EncabezadoPantalla from '../Componentes/EncabezadoPantalla';
import CampoTexto from '../Componentes/CampoTexto';
import Opciones from '../Componentes/Opciones';
import Boton from '../Componentes/Boton';

const ROLES: { valor: RolEmpleado; etiqueta: string }[] = [
  { valor: 'mesero', etiqueta: 'Mesero' },
  { valor: 'repartidor', etiqueta: 'Repartidor' },
  { valor: 'admin', etiqueta: 'Admin' },
];

const FORM_VACIO = { nombre: '', telefono: '', email: '', password: '', rol: 'mesero' as RolEmpleado };

export default function AdminEmpleados({ navigation }: any) {
  const { session } = useAuth();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setEmpleados(await obtenerEmpleados());
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los empleados.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardar = async () => {
    setError(null);
    if (!form.nombre.trim()) return setError('El nombre es obligatorio.');
    if (!esEmailValido(form.email)) return setError('Escribe un correo válido.');
    if (form.password.length < PASSWORD_MIN) {
      return setError(`La contraseña debe tener mínimo ${PASSWORD_MIN} caracteres.`);
    }
    setGuardando(true);
    try {
      await crearEmpleado(form);
      Alert.alert('Empleado creado', `${form.nombre} ya puede iniciar sesión con su correo.`);
      setForm(FORM_VACIO);
      setFormVisible(false);
      cargar();
    } catch (e: any) {
      const mensaje = e?.message ?? '';
      setError(mensaje.startsWith('Ya existe') ? mensaje : mensajeErrorAuth(mensaje));
    } finally {
      setGuardando(false);
    }
  };

  const elegirRol = (emp: Empleado) => {
    Alert.alert(`Rol de ${emp.nombre}`, 'Elige el nuevo rol', [
      ...ROLES.filter((r) => r.valor !== emp.rol).map((r) => ({
        text: r.etiqueta,
        onPress: async () => {
          try {
            await cambiarRolEmpleado(emp.id, r.valor);
            cargar();
          } catch (e: any) {
            Alert.alert('No se pudo cambiar', e?.message ?? 'Inténtalo de nuevo.');
          }
        },
      })),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  };

  const confirmarEliminar = (emp: Empleado) => {
    Alert.alert('Eliminar empleado', `¿Quitar a ${emp.nombre} del personal? Ya no podrá usar la app como empleado.`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarEmpleado(emp.id);
            cargar();
          } catch (e: any) {
            Alert.alert('No se pudo eliminar', e?.message ?? 'Inténtalo de nuevo.');
          }
        },
      },
    ]);
  };

  if (formVisible) {
    return (
      <ScrollView style={styles.contenedor} contentContainerStyle={{ paddingBottom: 40 }}>
        <EncabezadoPantalla titulo="Nuevo empleado" onVolver={() => setFormVisible(false)} textoVolver="← Cancelar" />
        <CampoTexto placeholder="Nombre" value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} />
        <CampoTexto
          placeholder="Teléfono"
          value={form.telefono}
          onChangeText={(v) => setForm({ ...form, telefono: v })}
          keyboardType="phone-pad"
        />
        <CampoTexto
          placeholder="Correo (con este inicia sesión)"
          value={form.email}
          onChangeText={(v) => setForm({ ...form, email: v })}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <CampoTexto
          placeholder={`Contraseña inicial (mín. ${PASSWORD_MIN})`}
          value={form.password}
          onChangeText={(v) => setForm({ ...form, password: v })}
          secureTextEntry
        />
        <Text style={styles.etiqueta}>Rol</Text>
        <Opciones opciones={ROLES} seleccionada={form.rol} onCambiar={(rol) => setForm({ ...form, rol })} />
        {error && <Text style={styles.error}>{error}</Text>}
        <Boton titulo="Crear empleado" onPress={guardar} cargando={guardando} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.contenedor}>
      <EncabezadoPantalla titulo="Empleados" onVolver={() => navigation.goBack()} />
      <Boton
        titulo="+ Nuevo empleado"
        onPress={() => {
          setError(null);
          setFormVisible(true);
        }}
      />
      <View style={{ height: 12 }} />
      <FlatList
        data={empleados}
        keyExtractor={(e) => String(e.id)}
        refreshing={cargando}
        onRefresh={cargar}
        ListEmptyComponent={!cargando ? <Text style={styles.vacio}>No hay empleados.</Text> : null}
        renderItem={({ item }) => {
          const esYo = item.auth_id === session?.user.id;
          return (
            <View style={styles.tarjeta}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nombre}>
                  {item.nombre}
                  {esYo ? ' (tú)' : ''}
                </Text>
                <Text style={styles.detalle}>
                  {item.rol}
                  {item.telefono ? ` · ${item.telefono}` : ''}
                </Text>
              </View>
              {/* El admin no puede cambiarse el rol ni eliminarse a sí mismo */}
              {!esYo && (
                <View style={styles.acciones}>
                  <TouchableOpacity onPress={() => elegirRol(item)}>
                    <Text style={styles.accion}>Rol</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmarEliminar(item)}>
                    <Text style={[styles.accion, { color: '#C62828' }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
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
  detalle: { color: colores.gris, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  acciones: { flexDirection: 'row', gap: 16 },
  accion: { color: colores.primario, fontWeight: '700' },
  etiqueta: { fontWeight: '700', color: colores.texto, marginBottom: 8 },
  vacio: { textAlign: 'center', color: colores.gris, marginTop: 24 },
  error: { color: '#C62828', marginBottom: 12, textAlign: 'center' },
});
