import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navegacion/StackNavigator';
import { supabase } from '../config/supabase';
import { colores } from '../config/tema';
import { esEmailValido, mensajeErrorAuth, PASSWORD_MIN } from '../config/validaciones';
import Boton from '../Componentes/Boton';
import CampoTexto from '../Componentes/CampoTexto';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function Login({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iniciarSesion = async () => {
    setError(null);
    if (!esEmailValido(email)) {
      setError('Escribe un correo válido.');
      return;
    }
    if (password.length < PASSWORD_MIN) {
      setError(`La contraseña debe tener mínimo ${PASSWORD_MIN} caracteres.`);
      return;
    }
    setCargando(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
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
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <CampoTexto
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Boton titulo="Entrar" onPress={iniciarSesion} cargando={cargando} />
      <View style={{ height: 12 }} />
      <Boton titulo="Crear cuenta" onPress={() => navigation.navigate('Registro')} secundario />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colores.fondo },
  titulo: { fontSize: 32, fontWeight: '800', color: colores.primario, textAlign: 'center' },
  subtitulo: { fontSize: 16, color: colores.gris, textAlign: 'center', marginBottom: 32 },
  error: { color: '#C62828', marginBottom: 12, textAlign: 'center' },
});