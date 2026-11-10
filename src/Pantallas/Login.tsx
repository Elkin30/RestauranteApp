import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navegacion/StackNavigator';
import { supabase } from '../config/supabase';
import { colores } from '../config/tema';
import {
  Errores,
  sinErrores,
  normalizarEmail,
  validarEmail,
  validarPasswordLogin,
  mensajeErrorAuth,
  PASSWORD_MAX,
} from '../config/validaciones';
import Boton from '../Componentes/Boton';
import CampoTexto from '../Componentes/CampoTexto';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const FORM_VACIO = { email: '', password: '' };

export default function Login({ navigation }: Props) {
  const [form, setForm] = useState(FORM_VACIO);
  const [errores, setErrores] = useState<Errores<typeof FORM_VACIO>>({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al escribir en un campo se borra su error
  const cambiar = (campo: keyof typeof FORM_VACIO, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const iniciarSesion = async () => {
    setError(null);
    const nuevos = { email: validarEmail(form.email), password: validarPasswordLogin(form.password) };
    setErrores(nuevos);
    if (!sinErrores(nuevos)) return;

    setCargando(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizarEmail(form.email),
        password: form.password,
      });
      if (error) setError(mensajeErrorAuth(error.message));
      // Si sale bien, AuthContext detecta la sesión y la app pasa sola al Home.
    } catch {
      setError('No hay conexión con el servidor. Revisa tu internet.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>🍔 RestauranteApp</Text>
      <Text style={styles.subtitulo}>Inicia sesión para pedir</Text>

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
        placeholder="Tu contraseña"
        value={form.password}
        onChangeText={(v) => cambiar('password', v)}
        error={errores.password}
        maxLength={PASSWORD_MAX}
        secureTextEntry
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Boton titulo="Entrar" onPress={iniciarSesion} cargando={cargando} />
      <View style={{ height: 12 }} />
      <Boton titulo="Crear cuenta" onPress={() => navigation.navigate('Registro')} secundario />

      {/* El juego no necesita cuenta */}
      <TouchableOpacity style={styles.juego} onPress={() => navigation.navigate('JuegoCulebrita')}>
        <Text style={styles.textoJuego}>🐍 Jugar Culebrita (sin iniciar sesión)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colores.fondo },
  titulo: { fontSize: 32, fontWeight: '800', color: colores.primario, textAlign: 'center' },
  subtitulo: { fontSize: 16, color: colores.gris, textAlign: 'center', marginBottom: 32 },
  error: { color: colores.error, marginBottom: 12, textAlign: 'center' },
  juego: { marginTop: 24, padding: 8, alignItems: 'center' },
  textoJuego: { color: colores.primario, fontWeight: '700', fontSize: 15 },
});
