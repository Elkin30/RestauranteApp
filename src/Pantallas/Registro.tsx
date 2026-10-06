import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navegacion/StackNavigator';
import { supabase } from '../config/supabase';
import { colores } from '../config/tema';
import Boton from '../Componentes/Boton';
import CampoTexto from '../Componentes/CampoTexto';

type Props = NativeStackScreenProps<RootStackParamList, 'Registro'>;

export default function Registro({ navigation }: Props) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const registrar = async () => {
  if (!nombre || !email || password.length < 6) {
    Alert.alert('Revisa los datos', 'Nombre y correo son obligatorios. La contraseña debe tener mínimo 6 caracteres.');
    return;
  }
  setCargando(true);
  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { nombre, telefono } },
  });
  setCargando(false);

  if (error) {
    Alert.alert('No se pudo registrar', error.message);
    return;
  }

  Alert.alert('Cuenta creada', 'Ya puedes iniciar sesión.');
  navigation.navigate('Login');
};

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Crear cuenta</Text>
      <CampoTexto placeholder="Nombre" value={nombre} onChangeText={setNombre} />
      <CampoTexto placeholder="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
      <CampoTexto placeholder="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <CampoTexto placeholder="Contraseña (mín. 6)" value={password} onChangeText={setPassword} secureTextEntry />
      <Boton titulo="Registrarme" onPress={registrar} cargando={cargando} />
      <View style={{ height: 12 }} />
      <Boton titulo="Volver" onPress={() => navigation.goBack()} secundario />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colores.fondo },
  titulo: { fontSize: 28, fontWeight: '800', color: colores.texto, marginBottom: 24 },
});