import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navegacion/StackNavigator';
import { supabase } from '../config/supabase';
import { colores } from '../config/tema';
import { esEmailValido, mensajeErrorAuth, PASSWORD_MIN } from '../config/validaciones';
import Boton from '../Componentes/Boton';
import CampoTexto from '../Componentes/CampoTexto';

type Props = NativeStackScreenProps<RootStackParamList, 'Registro'>;

export default function Registro({ navigation }: Props) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registrar = async () => {
    setError(null);
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { nombre: nombre.trim(), telefono: telefono.trim() } },
      });
      if (error) {
        setError(mensajeErrorAuth(error.message));
        return;
      }
      if (!data.session) {
        // Solo pasa si la confirmación de correo está activada
        Alert.alert('Cuenta creada', 'Revisa tu correo para confirmar la cuenta y luego inicia sesión.');
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
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Crear cuenta</Text>
      <CampoTexto placeholder="Nombre" value={nombre} onChangeText={setNombre} />
      <CampoTexto placeholder="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
      <CampoTexto placeholder="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <CampoTexto placeholder={`Contraseña (mín. ${PASSWORD_MIN})`} value={password} onChangeText={setPassword} secureTextEntry />

      {error && <Text style={styles.error}>{error}</Text>}

      <Boton titulo="Registrarme" onPress={registrar} cargando={cargando} />
      <View style={{ height: 12 }} />
      <Boton titulo="Volver" onPress={() => navigation.goBack()} secundario />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colores.fondo },
  titulo: { fontSize: 28, fontWeight: '800', color: colores.texto, marginBottom: 24 },
  error: { color: '#C62828', marginBottom: 12, textAlign: 'center' },
});