import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../config/supabase';
import { colores } from '../config/tema';

interface HeaderProps {
  titulo: string;
  navigation?: any;
}

export const Header: React.FC<HeaderProps> = ({ titulo }) => {
  const cerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo}</Text>
      <TouchableOpacity style={styles.botonLogout} onPress={cerrarSesion}>
        <Text style={styles.textoLogout}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: colores.primario,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  titulo: { color: colores.blanco, fontSize: 18, fontWeight: 'bold' },
  botonLogout: { backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 8, borderRadius: 6 },
  textoLogout: { color: colores.blanco, fontSize: 12, fontWeight: '600' },
});