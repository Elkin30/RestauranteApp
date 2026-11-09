import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { avisar, confirmar } from '../config/dialogos';
import { colores } from '../config/tema';
import {
  Errores,
  sinErrores,
  normalizarEmail,
  validarNombre,
  validarTelefono,
  validarEmail,
  validarPassword,
  validarConfirmacion,
  mensajeErrorAuth,
  NOMBRE_MAX,
  PASSWORD_MAX,
  TELEFONO_DIGITOS,
} from '../config/validaciones';
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

const FORM_VACIO = { nombre: '', telefono: '', email: '', password: '', confirmar: '', rol: 'mesero' as RolEmpleado };
type CampoForm = Exclude<keyof typeof FORM_VACIO, 'rol'>;

export default function AdminEmpleados({ navigation }: any) {
  const { session } = useAuth();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  // Empleado al que se le está eligiendo un nuevo rol
  const [cambiandoRolId, setCambiandoRolId] = useState<number | null>(null);
  const [errores, setErrores] = useState<Errores<typeof FORM_VACIO>>({});
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setEmpleados(await obtenerEmpleados());
    } catch {
      avisar('Error', 'No se pudieron cargar los empleados.');
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

  // Al escribir en un campo se borra su error
  const cambiar = (campo: CampoForm, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const guardar = async () => {
    setError(null);
    const nuevos = {
      nombre: validarNombre(form.nombre),
      telefono: validarTelefono(form.telefono),
      email: validarEmail(form.email),
      password: validarPassword(form.password),
      confirmar: validarConfirmacion(form.password, form.confirmar),
    };
    setErrores(nuevos);
    if (!sinErrores(nuevos)) return;

    setGuardando(true);
    try {
      await crearEmpleado({
        nombre: form.nombre,
        telefono: form.telefono,
        email: normalizarEmail(form.email),
        password: form.password,
        rol: form.rol,
      });
      avisar('Empleado creado', `${form.nombre} ya puede iniciar sesión con su correo.`);
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

  const cambiarRol = async (emp: Empleado, rol: RolEmpleado) => {
    if (rol === emp.rol) return;
    const etiqueta = ROLES.find((r) => r.valor === rol)?.etiqueta ?? rol;
    if (!(await confirmar('Cambiar rol', `¿Cambiar a ${emp.nombre} al rol ${etiqueta}?`, 'Cambiar'))) return;
    try {
      await cambiarRolEmpleado(emp.id, rol);
      setCambiandoRolId(null);
      cargar();
    } catch (e: any) {
      avisar('No se pudo cambiar', e?.message ?? 'Inténtalo de nuevo.');
    }
  };

  const confirmarEliminar = async (emp: Empleado) => {
    const ok = await confirmar(
      'Eliminar empleado',
      `¿Quitar a ${emp.nombre} del personal? Ya no podrá usar la app como empleado.`,
      'Eliminar'
    );
    if (!ok) return;
    try {
      await eliminarEmpleado(emp.id);
      cargar();
    } catch (e: any) {
      avisar('No se pudo eliminar', e?.message ?? 'Inténtalo de nuevo.');
    }
  };

  if (formVisible) {
    return (
      <ScrollView style={styles.contenedor} contentContainerStyle={{ paddingBottom: 40 }}>
        <EncabezadoPantalla titulo="Nuevo empleado" onVolver={() => setFormVisible(false)} textoVolver="← Cancelar" />
        <CampoTexto
          etiqueta="Nombre"
          obligatorio
          placeholder="Ej: Carlos Gómez"
          value={form.nombre}
          onChangeText={(v) => cambiar('nombre', v)}
          error={errores.nombre}
          maxLength={NOMBRE_MAX}
        />
        <CampoTexto
          etiqueta="Teléfono celular"
          obligatorio
          placeholder="3001234567"
          value={form.telefono}
          onChangeText={(v) => cambiar('telefono', v.replace(/\D/g, ''))}
          error={errores.telefono}
          keyboardType="phone-pad"
          maxLength={TELEFONO_DIGITOS}
        />
        <CampoTexto
          etiqueta="Correo (con este inicia sesión)"
          obligatorio
          placeholder="nombre@gmail.com"
          value={form.email}
          onChangeText={(v) => cambiar('email', v)}
          error={errores.email}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <CampoTexto
          etiqueta="Contraseña inicial"
          obligatorio
          placeholder="6 a 12 caracteres, letras y números"
          value={form.password}
          onChangeText={(v) => cambiar('password', v)}
          error={errores.password}
          maxLength={PASSWORD_MAX}
          secureTextEntry
        />
        <CampoTexto
          etiqueta="Confirmar contraseña"
          obligatorio
          placeholder="Repite la contraseña"
          value={form.confirmar}
          onChangeText={(v) => cambiar('confirmar', v)}
          error={errores.confirmar}
          maxLength={PASSWORD_MAX}
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
          setErrores({});
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
              <View style={styles.fila}>
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
                    <TouchableOpacity onPress={() => setCambiandoRolId(cambiandoRolId === item.id ? null : item.id)}>
                      <Text style={styles.accion}>{cambiandoRolId === item.id ? 'Cerrar' : 'Rol'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmarEliminar(item)}>
                      <Text style={[styles.accion, { color: colores.error }]}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {cambiandoRolId === item.id && (
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.detalle, { marginBottom: 6 }]}>Elige el nuevo rol:</Text>
                  <Opciones opciones={ROLES} seleccionada={item.rol} onCambiar={(rol) => cambiarRol(item, rol)} />
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
    backgroundColor: colores.blanco,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  fila: { flexDirection: 'row', alignItems: 'center' },
  nombre: { fontSize: 16, fontWeight: '700', color: colores.texto },
  detalle: { color: colores.gris, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  acciones: { flexDirection: 'row', gap: 16 },
  accion: { color: colores.primario, fontWeight: '700' },
  etiqueta: { fontWeight: '700', color: colores.texto, marginBottom: 8 },
  vacio: { textAlign: 'center', color: colores.gris, marginTop: 24 },
  error: { color: colores.error, marginBottom: 12, textAlign: 'center' },
});
