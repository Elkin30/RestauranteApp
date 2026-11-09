import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { avisar } from '../config/dialogos';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navegacion/StackNavigator';
import { supabase } from '../config/supabase';
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
import Boton from '../Componentes/Boton';
import CampoTexto from '../Componentes/CampoTexto';

type Props = NativeStackScreenProps<RootStackParamList, 'Registro'>;

const FORM_VACIO = { nombre: '', telefono: '', email: '', password: '', confirmar: '' };

export default function Registro({ navigation }: Props) {
  const [form, setForm] = useState(FORM_VACIO);
  const [errores, setErrores] = useState<Errores<typeof FORM_VACIO>>({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al escribir en un campo se borra su error
  const cambiar = (campo: keyof typeof FORM_VACIO, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const registrar = async () => {
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

    setCargando(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizarEmail(form.email),
        password: form.password,
        options: { data: { nombre: form.nombre.trim(), telefono: form.telefono.trim() } },
      });
      if (error) {
        setError(mensajeErrorAuth(error.message));
        return;
      }
      if (!data.session) {
        // Solo pasa si la confirmación de correo está activada
        avisar('Cuenta creada', 'Revisa tu correo para confirmar la cuenta y luego inicia sesión.');
        navigation.navigate('Login');
      }
      // Si hay sesión, la app entra sola al Home.
    } catch {
      setError('No hay conexión con el servidor. Revisa tu internet.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colores.fondo }}
      contentContainerStyle={styles.contenedor}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>Crear cuenta</Text>
      <CampoTexto
        etiqueta="Nombre"
        obligatorio
        placeholder="Ej: María Pérez"
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
        etiqueta="Correo"
        obligatorio
        placeholder="nombre@gmail.com"
        value={form.email}
        onChangeText={(v) => cambiar('email', v)}
        error={errores.email}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <CampoTexto
        etiqueta="Contraseña"
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

      {error && <Text style={styles.error}>{error}</Text>}

      <Boton titulo="Registrarme" onPress={registrar} cargando={cargando} />
      <View style={{ height: 12 }} />
      <Boton titulo="Volver" onPress={() => navigation.goBack()} secundario />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  titulo: { fontSize: 28, fontWeight: '800', color: colores.texto, marginBottom: 24 },
  error: { color: colores.error, marginBottom: 12, textAlign: 'center' },
});
