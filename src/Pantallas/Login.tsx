import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navegacion/StackNavigator';
import { supabase } from '../config/supabase';
import { colores } from '../config/tema';
import Boton from '../Componentes/Boton';
import CampoTexto from '../Componentes/CampoTexto';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function Login({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async () => {
    if (!email || !password) {
      Alert.alert('Faltan datos', 'Escribe tu correo y contraseña.');
      return;
    }
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setCargando(false);
    if (error) {
      Alert.alert('No se pudo iniciar sesión', error.message);
      return;
    }
    navigation.replace('Home');
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
});